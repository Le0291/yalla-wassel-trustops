import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('password123', 10);

  await prisma.deliveryProof.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();

  // Dispatcher
  await prisma.user.create({
    data: {
      email: 'dispatcher@yallawassel.com',
      password: hashed,
      role: 'DISPATCHER',
      name: 'Sara Al-Sharif',
      phone: '0799123456',
    },
  });

  // Drivers
  const mahmoud = await prisma.user.create({
    data: {
      email: 'mahmoud@yallawassel.com',
      password: hashed,
      role: 'DRIVER',
      name: 'Mahmoud Salem',
      phone: '0776428193',
      zone: 'West Amman',
      driverStatus: 'AVAILABLE',
    },
  });

  const yousef = await prisma.user.create({
    data: {
      email: 'yousef@yallawassel.com',
      password: hashed,
      role: 'DRIVER',
      name: 'Yousef Daher',
      phone: '0795581247',
      zone: 'West Amman',
      driverStatus: 'ON_DELIVERY',
    },
  });

  const hamza = await prisma.user.create({
    data: {
      email: 'hamza@yallawassel.com',
      password: hashed,
      role: 'DRIVER',
      name: 'Hamza Najjar',
      phone: '0783917065',
      zone: 'Central Amman',
      driverStatus: 'AVAILABLE',
    },
  });

  await prisma.user.create({
    data: {
      email: 'amjad@yallawassel.com',
      password: hashed,
      role: 'DRIVER',
      name: 'Amjad Tarzi',
      phone: '0798243519',
      zone: 'Central Amman',
      driverStatus: 'AVAILABLE',
    },
  });

  const wael = await prisma.user.create({
    data: {
      email: 'wael@yallawassel.com',
      password: hashed,
      role: 'DRIVER',
      name: 'Wael Odeh',
      phone: '0772159468',
      zone: 'East Amman',
      driverStatus: 'ON_DELIVERY',
    },
  });

  await prisma.user.create({
    data: {
      email: 'khaled@yallawassel.com',
      password: hashed,
      role: 'DRIVER',
      name: 'Khaled Al Rifai',
      phone: '0787634082',
      zone: 'East Amman',
      driverStatus: 'OFF_DUTY',
    },
  });

  // Orders
  const order1001 = await prisma.order.create({
    data: {
      orderNumber: '1001',
      senderBusiness: 'Pharmacy Reem',
      customerName: 'Mona K.',
      deliveryArea: 'Khalda',
      priority: 'URGENT',
      status: 'PICKED_UP',
      driverId: yousef.id,
      estimatedWindow: '2:00 PM – 4:00 PM',
    },
  });

  const order1002 = await prisma.order.create({
    data: {
      orderNumber: '1002',
      senderBusiness: 'Bloom Flowers',
      customerName: 'Ahmad S.',
      deliveryArea: 'Abdoun',
      priority: 'NORMAL',
      status: 'ASSIGNED',
      driverId: mahmoud.id,
      estimatedWindow: '3:00 PM – 5:00 PM',
    },
  });

  await prisma.order.create({
    data: {
      orderNumber: '1003',
      senderBusiness: 'Mama Kitchen',
      customerName: 'Layla H.',
      deliveryArea: 'Shmeisani',
      priority: 'NORMAL',
      status: 'WAITING',
    },
  });

  const order1004 = await prisma.order.create({
    data: {
      orderNumber: '1004',
      senderBusiness: 'FixIt Electronics',
      customerName: 'Tareq M.',
      deliveryArea: 'Tlaa Al Ali',
      priority: 'NORMAL',
      status: 'DELIVERED',
      driverId: hamza.id,
      estimatedWindow: '10:00 AM – 12:00 PM',
    },
  });

  await prisma.order.create({
    data: {
      orderNumber: '1005',
      senderBusiness: 'Pharmacy Reem',
      customerName: 'Hala D.',
      deliveryArea: 'Jabal Amman',
      priority: 'URGENT',
      status: 'WAITING',
    },
  });

  // Wael has an active order to match his ON_DELIVERY status
  const order1006 = await prisma.order.create({
    data: {
      orderNumber: '1006',
      senderBusiness: 'City Mall Shop',
      customerName: 'Rami A.',
      deliveryArea: 'Marka',
      priority: 'NORMAL',
      status: 'ON_THE_WAY',
      driverId: wael.id,
      estimatedWindow: '1:00 PM – 3:00 PM',
    },
  });

  // Status histories
  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId: order1001.id, status: 'ASSIGNED',   changedBy: 'Sara Al-Sharif',  note: 'Assigned to Yousef' },
      { orderId: order1001.id, status: 'ACCEPTED',   changedBy: 'Yousef Daher' },
      { orderId: order1001.id, status: 'PICKED_UP',  changedBy: 'Yousef Daher',    note: 'Picked up from Pharmacy Reem' },

      { orderId: order1002.id, status: 'ASSIGNED',   changedBy: 'Sara Al-Sharif',  note: 'Assigned to Mahmoud' },

      { orderId: order1004.id, status: 'ASSIGNED',   changedBy: 'Sara Al-Sharif' },
      { orderId: order1004.id, status: 'ACCEPTED',   changedBy: 'Hamza Najjar' },
      { orderId: order1004.id, status: 'PICKED_UP',  changedBy: 'Hamza Najjar' },
      { orderId: order1004.id, status: 'ON_THE_WAY', changedBy: 'Hamza Najjar' },
      { orderId: order1004.id, status: 'DELIVERED',  changedBy: 'Hamza Najjar',    note: 'Delivered successfully' },

      { orderId: order1006.id, status: 'ASSIGNED',   changedBy: 'Sara Al-Sharif' },
      { orderId: order1006.id, status: 'ACCEPTED',   changedBy: 'Wael Odeh' },
      { orderId: order1006.id, status: 'PICKED_UP',  changedBy: 'Wael Odeh' },
      { orderId: order1006.id, status: 'ON_THE_WAY', changedBy: 'Wael Odeh' },
    ],
  });

  // Delivery proof for order 1004
  await prisma.deliveryProof.create({
    data: {
      orderId: order1004.id,
      recipientName: 'Tareq M.',
      notes: 'Handed directly to customer at door.',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`📦 Orders: ${await prisma.order.count()}`);
  console.log(`👤 Users:  ${await prisma.user.count()}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
