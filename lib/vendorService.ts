import { collection, doc, setDoc, updateDoc, query, where, getDocs, getDoc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Vendor, InventoryItem } from '@/types';

function generateGeohash(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

export async function registerVendor(userId: string, vendorData: any, initialInventory?: any[]) {
  const vendorRef = doc(collection(db, 'vendors'));
  const batch = writeBatch(db);
  
  const vendor = {
    ...vendorData,
    ownerId: userId,
    location: { ...vendorData.location, geohash: generateGeohash(vendorData.location.lat, vendorData.location.lng) },
    rating: 0,
    reviewCount: 0,
    isVerified: false,
    isOpen: true,
    createdAt: serverTimestamp()
  };
  
  batch.set(vendorRef, vendor);
  
  if (initialInventory?.length) {
    initialInventory.forEach((item) => {
      const itemRef = doc(collection(db, 'vendors', vendorRef.id, 'inventory'));
      batch.set(itemRef, { ...item, vendorId: vendorRef.id, lastUpdated: serverTimestamp() });
    });
  }
  
  batch.update(doc(db, 'users', userId), { role: 'vendor', vendorId: vendorRef.id });
  await batch.commit();
  return vendorRef.id;
}

export async function findNearbyVendors(lat: number, lng: number, radiusKm: number = 10, filters?: any) {
  const vendorsQuery = query(collection(db, 'vendors'), where('isVerified', '==', true));
  const snapshot = await getDocs(vendorsQuery);
  const vendors: any[] = [];
  
  for (const docSnap of snapshot.docs) {
    const vendor = { id: docSnap.id, ...docSnap.data() } as Vendor;
    const distance = calculateDistance(lat, lng, vendor.location.lat, vendor.location.lng);
    
    if (distance <= radiusKm) {
      if (filters?.isOpen !== undefined && vendor.isOpen !== filters.isOpen) continue;
      const invSnap = await getDocs(collection(db, 'vendors', docSnap.id, 'inventory'));
      const inventory = invSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((item: any) => item.isAvailable && item.quantity > 0);
      if (filters?.gasType && !inventory.some((item: any) => item.gasType === filters.gasType)) continue;
      vendors.push({ ...vendor, distance, inventory });
    }
  }
  return vendors.sort((a, b) => a.distance - b.distance);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function updateInventoryItem(vendorId: string, itemId: string, updates: any) {
  await updateDoc(doc(db, 'vendors', vendorId, 'inventory', itemId), { ...updates, lastUpdated: serverTimestamp() });
}

export function subscribeToVendor(vendorId: string, callback: any) {
  return onSnapshot(doc(db, 'vendors', vendorId), (doc) => callback(doc.exists() ? { id: doc.id, ...doc.data() } : null));
}

export function subscribeToInventory(vendorId: string, callback: any) {
  return onSnapshot(collection(db, 'vendors', vendorId, 'inventory'), (snapshot) => callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
}
