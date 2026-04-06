export type UserRole = 'customer' | 'driver' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  role: UserRole;
  phoneVerified: boolean;
  photoURL?: string;
  createdAt: any;
  updatedAt: any;
}

export type OrderStatus = 'pending' | 'confirmed' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  driverId?: string;
  driverName?: string;
  items: string;
  total: number;
  status: OrderStatus;
  address: string;
  phone: string;
  createdAt: any;
  updatedAt: any;
}

export interface GasProduct {
  id: string;
  type: 'lpg' | 'propane';
  size: string;
  name: string;
  price: number;
  inStock: boolean;
}
