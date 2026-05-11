import { collection, query, where, getDocs, GeoPoint } from "firebase/firestore";
import { db } from "@/config/firebase";

interface Seller {
  id: string;
  location: GeoPoint;
  inventory: { type: string; quantity: number; price: number }[];
  isOnline: boolean;
  rating: number;
  deliveryRadius: number;
}

export async function findBestSeller(buyerLoc: GeoPoint, gasType: string) {
  const sellersRef = collection(db, "sellers");
  const q = query(sellersRef, where("isOnline", "==", true));
  const snapshot = await getDocs(q);
  
  const sellers: Seller[] = [];
  snapshot.forEach(doc => sellers.push({ id: doc.id, ...doc.data() } as Seller));
  
  return sellers
    .filter(s => s.inventory.find(i => i.type === gasType && i.quantity > 0))
    .sort((a, b) => {
      const distA = calcDistance(buyerLoc, a.location);
      const distB = calcDistance(buyerLoc, b.location);
      return distA - distB;
    })[0] || null;
}

function calcDistance(a: GeoPoint, b: GeoPoint) {
  const R = 6371;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const a2 = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1-a2));
}
