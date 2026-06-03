import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

export interface Order {
  id?: string;
  userId: string;
  sellerId: string;
  items: any[];
  total: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  deliveryAddress?: string;
  createdAt?: Timestamp;
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>) {
  const ordersRef = collection(db, 'orders');
  return addDoc(ordersRef, {
    ...order,
    createdAt: Timestamp.now(),
    status: 'pending'
  });
}

export async function getUserOrders(userId: string) {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

export async function getSellerOrders(sellerId: string) {
  const q = query(
    collection(db, 'orders'),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}
