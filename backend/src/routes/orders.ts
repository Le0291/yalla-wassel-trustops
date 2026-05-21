import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const driverSelect = { select: { id: true, name: true, phone: true, zone: true } };

// List orders — drivers see only their own
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const { status, priority, search } = req.query;
  const where: Record<string, unknown> = {};

  if (req.user!.role === 'DRIVER') {
    where.driverId = req.user!.id;
  } else {
    if (status && status !== 'ALL') where.status = status;
    if (priority && priority !== 'ALL') where.priority = priority;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string } },
        { customerName: { contains: search as string } },
        { senderBusiness: { contains: search as string } },
        { deliveryArea: { contains: search as string } },
      ];
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      driver: driverSelect,
      issues: { where: { resolved: false } },
      proof: true,
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });

  res.json(orders);
});

// Create order
router.post('/', authenticate, requireRole('DISPATCHER'), async (req: AuthRequest, res) => {
  const { senderBusiness, customerName, customerPhone, deliveryArea, address, priority, dispatcherNote, estimatedWindow } = req.body;
  if (!senderBusiness || !customerName || !deliveryArea) {
    return res.status(400).json({ error: 'senderBusiness, customerName, and deliveryArea are required' });
  }

  const count = await prisma.order.count();
  const orderNumber = String(1000 + count + 1);

  const order = await prisma.order.create({
    data: { orderNumber, senderBusiness, customerName, customerPhone, deliveryArea, address, priority: priority || 'NORMAL', dispatcherNote, estimatedWindow },
    include: { driver: driverSelect, issues: true, proof: true },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, status: 'WAITING', changedBy: req.user!.name, note: 'Order created' },
  });

  res.status(201).json(order);
});

// Get single order with full history
router.get('/:id', authenticate, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      driver: driverSelect,
      issues: { include: { driver: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      proof: true,
      statusHistory: { orderBy: { timestamp: 'asc' } },
    },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Update basic order fields
router.put('/:id', authenticate, requireRole('DISPATCHER'), async (req: AuthRequest, res) => {
  const { senderBusiness, customerName, customerPhone, deliveryArea, address, priority, dispatcherNote, estimatedWindow } = req.body;
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { senderBusiness, customerName, customerPhone, deliveryArea, address, priority, dispatcherNote, estimatedWindow },
    include: { driver: driverSelect, issues: true, proof: true },
  });
  res.json(order);
});

// Assign driver
router.put('/:id/assign', authenticate, requireRole('DISPATCHER'), async (req: AuthRequest, res) => {
  const { driverId } = req.body;
  if (!driverId) return res.status(400).json({ error: 'driverId required' });

  const driver = await prisma.user.findUnique({ where: { id: driverId } });
  if (!driver || driver.role !== 'DRIVER') return res.status(404).json({ error: 'Driver not found' });

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { driverId, status: 'ASSIGNED' },
    include: { driver: driverSelect, issues: true, proof: true },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, status: 'ASSIGNED', changedBy: req.user!.name, note: `Assigned to ${driver.name}` },
  });

  res.json(order);
});

// Update status
router.put('/:id/status', authenticate, async (req: AuthRequest, res) => {
  const { status, note } = req.body;
  const valid = ['WAITING', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'ISSUE_REPORTED'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  if (req.user!.role === 'DRIVER') {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.driverId !== req.user!.id) return res.status(403).json({ error: 'Not your order' });
  }

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: { driver: driverSelect, issues: true, proof: true },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, status, changedBy: req.user!.name, note },
  });

  res.json(order);
});

// Submit delivery proof (driver)
router.post('/:id/proof', authenticate, requireRole('DRIVER'), async (req: AuthRequest, res) => {
  const { recipientName, notes } = req.body;
  if (!recipientName) return res.status(400).json({ error: 'recipientName required' });

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || order.driverId !== req.user!.id) return res.status(403).json({ error: 'Not your order' });

  const proof = await prisma.deliveryProof.upsert({
    where: { orderId: req.params.id },
    create: { orderId: req.params.id, recipientName, notes },
    update: { recipientName, notes },
  });

  await prisma.order.update({ where: { id: req.params.id }, data: { status: 'DELIVERED' } });

  await prisma.orderStatusHistory.create({
    data: { orderId: req.params.id, status: 'DELIVERED', changedBy: req.user!.name, note: `Signed by: ${recipientName}` },
  });

  res.json(proof);
});

// Report issue (driver)
router.post('/:id/issue', authenticate, requireRole('DRIVER'), async (req: AuthRequest, res) => {
  const { reason, description } = req.body;
  if (!reason) return res.status(400).json({ error: 'reason required' });

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || order.driverId !== req.user!.id) return res.status(403).json({ error: 'Not your order' });

  const issue = await prisma.issue.create({
    data: { orderId: req.params.id, driverId: req.user!.id, reason, description },
  });

  await prisma.order.update({ where: { id: req.params.id }, data: { status: 'ISSUE_REPORTED' } });

  await prisma.orderStatusHistory.create({
    data: { orderId: req.params.id, status: 'ISSUE_REPORTED', changedBy: req.user!.name, note: `Issue: ${reason}` },
  });

  res.json(issue);
});

// Resolve issue (dispatcher)
router.put('/:id/issue/:issueId/resolve', authenticate, requireRole('DISPATCHER'), async (req: AuthRequest, res) => {
  const { resolvedNote, newStatus } = req.body;

  const issue = await prisma.issue.update({
    where: { id: req.params.issueId },
    data: { resolved: true, resolvedAt: new Date(), resolvedNote },
  });

  if (newStatus) {
    await prisma.order.update({ where: { id: req.params.id }, data: { status: newStatus } });
    await prisma.orderStatusHistory.create({
      data: { orderId: req.params.id, status: newStatus, changedBy: req.user!.name, note: `Issue resolved: ${resolvedNote || ''}` },
    });
  }

  res.json(issue);
});

export { router as ordersRouter };
