export type Role = 'ADMIN' | 'DISPATCHER' | 'DRIVER';
export type DriverStatus = 'AVAILABLE' | 'ON_DELIVERY' | 'ON_BREAK' | 'OFF_DUTY';
export type OrderStatus = 'WAITING' | 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED' | 'ISSUE_REPORTED';
export type Priority = 'NORMAL' | 'URGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  zone?: string;
  driverStatus: DriverStatus;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  zone?: string;
  driverStatus: DriverStatus;
  activeOrders: number;
  completedToday: number;
  orders?: { id: string; status: string; orderNumber: string; deliveryArea: string; priority: string }[];
}

export interface Issue {
  id: string;
  reason: string;
  description?: string;
  resolved: boolean;
  resolvedNote?: string;
  createdAt: string;
  driver?: { name: string };
}

export interface DeliveryProof {
  id: string;
  recipientName: string;
  notes?: string;
  submittedAt: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  changedBy?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  senderBusiness: string;
  customerName: string;
  customerPhone?: string;
  deliveryArea: string;
  address?: string;
  priority: Priority;
  status: OrderStatus;
  driverId?: string;
  driver?: { id: string; name: string; phone?: string; zone?: string };
  dispatcherNote?: string;
  estimatedWindow?: string;
  createdAt: string;
  updatedAt: string;
  issues: Issue[];
  proof?: DeliveryProof;
  statusHistory?: StatusHistoryEntry[];
}

export interface DriverStats {
  driver: { id: string; name: string; zone?: string; driverStatus: DriverStatus };
  total: number;
  completed: number;
  active: number;
  issues: number;
  completedToday: number;
  completionRate: number;
}

export interface ReportsData {
  drivers: DriverStats[];
  summary: {
    totalOrders: number;
    completedOrders: number;
    avgOrders: number;
    fairnessScore: number;
    maxOrders: number;
    minOrders: number;
  };
}
