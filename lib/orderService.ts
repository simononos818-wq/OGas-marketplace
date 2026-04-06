import { collection, doc, setDoc, updateDoc, query, where, getDoc, onSnapshot, serverTimestamp, writeBatch, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

export async function createOrder(orderData: any): Promise<string> {
  const orderRef = doc(collection(db, 'orders'));
  const pickupCode = orderData.mode === 'pickup' ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined;
  const order = { ...orderData, status: orderData.mode === 'pickup' ? 'pending_pickup' : 'pending_delivery', pickupCode, createdAt: serverTimestamp() };
  
  await setDoc(orderRef, order);
  const batch = writeBatch(db);
  for (const item of orderData.items) {
    const itemRef = doc(db, 'vendors', orderData.vendorId, 'inventory', item.inventoryItemId);
    const itemSnap = await getDoc(itemRef);
    if (itemSnap.exists()) {
      const currentQty = itemSnap.data().quantity;
      batch.update(itemRef, { quantity: currentQty - item.quantity, isAvailable: currentQty - item.quantity > 0 });
    }
  }
  await batch.commit();
  return orderRef.id;
}

export async function updateOrderStatus(orderId: string, status: string, additionalData?: any) {
  const updates: any = { status, ...additionalData };
  if (status === 'picked_up') updates.pickedUpAt = serverTimestamp();
  if (status === 'delivered') updates.deliveredAt = serverTimestamp();
  if (status === 'driver_assigned') updates.assignedAt = serverTimestamp();
  await updateDoc(doc(db, 'orders', orderId), updates);
}

export function subscribeToOrder(orderId: string, callback: any) {
  return onSnapshot(doc(db, 'orders', orderId), (doc) => callback(doc.exists() ? { id: doc.id, ...doc.data() } : null));
}

export function subscribeToCustomerOrders(customerId: string, callback: any) {
  const q = query(collection(db, 'orders'), where('customerId', '==', customerId), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export function subscribeToVendorOrders(vendorId: string, callback: any) {
  const q = query(collection(db, 'orders'), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
}
