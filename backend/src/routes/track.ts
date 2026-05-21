import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/:orderNumber', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    select: {
      orderNumber: true,
      senderBusiness: true,
      deliveryArea: true,
      status: true,
      priority: true,
      estimatedWindow: true,
      createdAt: true,
      updatedAt: true,
      driver: { select: { name: true, phone: true } },
      statusHistory: { orderBy: { timestamp: 'asc' }, select: { status: true, timestamp: true, note: true } },
    },
  });

  if (!order) return res.status(404).json({ error: 'Order not found. Please check the order number.' });

  res.json({
    ...order,
    driver: order.driver
      ? { firstName: order.driver.name.split(' ')[0], phone: order.driver.phone }
      : null,
  });
});

export { router as trackRouter };
