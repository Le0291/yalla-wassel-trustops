import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all drivers with workload stats
router.get('/', authenticate, requireRole('DISPATCHER'), async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const drivers = await prisma.user.findMany({
    where: { role: 'DRIVER' },
    select: {
      id: true, name: true, email: true, phone: true, zone: true, driverStatus: true,
      orders: {
        where: { status: { notIn: ['DELIVERED'] } },
        select: { id: true, status: true, orderNumber: true, deliveryArea: true, priority: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const result = await Promise.all(drivers.map(async (d) => {
    const completedToday = await prisma.order.count({
      where: { driverId: d.id, status: 'DELIVERED', updatedAt: { gte: today } },
    });
    return { ...d, activeOrders: d.orders.length, completedToday };
  }));

  res.json(result);
});

// Suggest best driver for a zone
router.get('/suggested', authenticate, requireRole('DISPATCHER'), async (req, res) => {
  const { zone } = req.query;

  const drivers = await prisma.user.findMany({
    where: {
      role: 'DRIVER',
      driverStatus: 'AVAILABLE',
      ...(zone ? { zone: zone as string } : {}),
    },
    include: {
      orders: { where: { status: { notIn: ['DELIVERED'] } } },
    },
  });

  if (!drivers.length) return res.json(null);

  drivers.sort((a, b) => a.orders.length - b.orders.length);
  const best = drivers[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedToday = await prisma.order.count({
    where: { driverId: best.id, status: 'DELIVERED', updatedAt: { gte: today } },
  });

  res.json({
    id: best.id, name: best.name, phone: best.phone, zone: best.zone,
    driverStatus: best.driverStatus, activeOrders: best.orders.length, completedToday,
  });
});

// Update driver status (driver updates own; dispatcher updates any)
router.put('/:id/status', authenticate, async (req: AuthRequest, res) => {
  const { driverStatus } = req.body;
  const valid = ['AVAILABLE', 'ON_DELIVERY', 'ON_BREAK', 'OFF_DUTY'];
  if (!valid.includes(driverStatus)) return res.status(400).json({ error: 'Invalid status' });

  if (req.user!.role === 'DRIVER' && req.params.id !== req.user!.id) {
    return res.status(403).json({ error: 'Can only update your own status' });
  }

  const driver = await prisma.user.update({
    where: { id: req.params.id },
    data: { driverStatus },
    select: { id: true, name: true, driverStatus: true },
  });

  res.json(driver);
});

export { router as driversRouter };
