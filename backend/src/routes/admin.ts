import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate, requireRole('ADMIN'));

router.get('/dispatchers', async (_req, res) => {
  const dispatchers = await prisma.user.findMany({
    where: { role: 'DISPATCHER' },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(dispatchers);
});

router.post('/dispatchers', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 3) {
    return res.status(400).json({ error: 'Password must be at least 3 characters' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email is already in use' });

  const hashed = await bcrypt.hash(password, 10);
  const dispatcher = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashed,
      role: 'DISPATCHER',
    },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  });

  res.status(201).json(dispatcher);
});

export { router as adminRouter };
