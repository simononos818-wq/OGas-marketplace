import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function createOrder(data: any) {
  const ordersRef = collection(db, 'orders');
  const docRef = await addDoc(ordersRef, {
    ...data,
    status: data.status || 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}
