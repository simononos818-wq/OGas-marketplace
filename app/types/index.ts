export interface Seller {
  id: string;
  businessName: string;
  address: string;
  pricePerKg: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isOpen: boolean;
  phone: string;
  imageUrl?: string;
  deliveryFee: number;
  minOrderKg: number;
  maxOrderKg: number;
  description?: string;
}

export interface Order {
  id: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  kg: number;
  pricePerKg: number;
  deliveryFee: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'card' | 'bank_transfer' | 'cash_on_delivery';
  deliveryType: 'delivery' | 'pickup';
  address?: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  isSeller: boolean;
  sellerProfile?: Seller;
}
