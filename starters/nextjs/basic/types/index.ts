export interface Vendor {
  id: string;
  businessName: string;
  ownerId: string;
  phone: string;
  email: string;
  address: string;
  location: { lat: number; lng: number; geohash: string };
  isOpen: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  deliveryRadius: number;
  minOrderAmount: number;
  operatingHours: { open: string; close: string };
  paymentMethods: ('paystack' | 'cash' | 'pos')[];
  createdAt: any;
}

export interface InventoryItem {
  id: string;
  vendorId: string;
  gasType: '3kg' | '5kg' | '6kg' | '12.5kg' | '25kg' | '50kg';
  brand: 'Total' | 'Oando' | 'Mobil' | 'Nipco' | 'Rainoil' | 'Other';
  price: number;
  quantity: number;
  isAvailable: boolean;
  lastUpdated: any;
}

export type OrderMode = 'pickup' | 'delivery';
export type OrderStatus = 
  | 'pending_payment' | 'pending_pickup' | 'ready_for_pickup' | 'picked_up'
  | 'pending_delivery' | 'driver_assigned' | 'en_route' | 'arrived' | 'delivered' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vendorId: string;
  vendorName: string;
  vendorAddress: string;
  vendorLocation: { lat: number; lng: number };
  items: { inventoryItemId: string; gasType: string; brand: string; quantity: number; price: number }[];
  mode: OrderMode;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentRef: string;
  paidAt: any;
  createdAt: any;
  pickupCode?: string;
  pickedUpAt?: any;
  deliveryAddress?: string;
  deliveryLocation?: { lat: number; lng: number };
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverLocation?: { lat: number; lng: number; lastUpdated: any };
  assignedAt?: any;
  deliveredAt?: any;
}
