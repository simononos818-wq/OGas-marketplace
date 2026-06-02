import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type Seller = {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  location: string;
  state: string;
  address: string;
  cylinderSizes: string[];
  prices: Record<string, number>;
  isActive: boolean;
  verified: boolean;
  rating: number;
  totalOrders: number;
  createdAt: Timestamp;
};

export type Order = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  cylinderSize: string;
  quantity: number;
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: 'paystack' | 'cash';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled';
  paystackReference?: string;
  createdAt: Timestamp;
};

export async function getActiveSellers(state?: string): Promise<Seller[]> {
  const q = query(
    collection(db, 'sellers'),
    where('isActive', '==', true),
    where('verified', '==', true),
    orderBy('rating', 'desc')
  );
  const snap = await getDocs(q);
  const sellers = snap.docs.map(d => ({ id: d.id, ...d.data() } as Seller));
  if (state) return sellers.filter(s => s.state.toLowerCase() === state.toLowerCase());
  return sellers;
}

export async function getSellerById(id: string): Promise<Seller | null> {
  const snap = await getDoc(doc(db, 'sellers', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Seller;
}

export async function getSellerByEmail(email: string): Promise<Seller | null> {
  const q = query(collection(db, 'sellers'), where('email', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Seller;
}

export async function registerSeller(data: Omit<Seller, 'id' | 'createdAt' | 'rating' | 'totalOrders' | 'verified'>): Promise<string> {
  const ref = await addDoc(collection(db, 'sellers'), {
    ...data,
    verified: false,
    rating: 0,
    totalOrders: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function createOrder(data: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'orders'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getOrdersByPhone(phone: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('buyerPhone', '==', phone),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function getOrdersBySeller(sellerId: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function updateOrderStatus(orderId: string, orderStatus: Order['orderStatus']): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { orderStatus });
}
