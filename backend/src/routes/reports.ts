import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, requireRole('DISPATCHER'), async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const drivers = await prisma.user.findMany({
    where: { role: 'DRIVER' },
    select: { id: true, name: true, zone: true, driverStatus: true },
    orderBy: { name: 'asc' },
  });

  const stats = await Promise.all(drivers.map(async (driver) => {
    const [total, completed, issues, completedToday, active] = await Promise.all([
      prisma.order.count({ where: { driverId: driver.id } }),
      prisma.order.count({ where: { driverId: driver.id, status: 'DELIVERED' } }),
      prisma.issue.count({ where: { driverId: driver.id } }),
      prisma.order.count({ where: { driverId: driver.id, status: 'DELIVERED', updatedAt: { gte: today } } }),
      prisma.order.count({ where: { driverId: driver.id, status: { notIn: ['DELIVERED', 'WAITING'] } } }),
    ]);

    return {
      driver,
      total,
      completed,
      active,
      issues,
      completedToday,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }));

  const totalAll = stats.reduce((s, d) => s + d.total, 0);
  const completedAll = stats.reduce((s, d) => s + d.completed, 0);
  const avgOrders = drivers.length ? +(totalAll / drivers.length).toFixed(1) : 0;
  const maxOrders = Math.max(...stats.map((s) => s.total), 0);
  const minOrders = Math.min(...stats.map((s) => s.total), 0);
  const fairnessScore = maxOrders > 0 ? Math.round((1 - (maxOrders - minOrders) / maxOrders) * 100) : 100;

  res.json({
    drivers: stats,
    summary: {
      totalOrders: totalAll,
      completedOrders: completedAll,
      avgOrders,
      fairnessScore: Math.max(0, fairnessScore),
      maxOrders,
      minOrders,
    },
  });
});

export { router as reportsRouter };
