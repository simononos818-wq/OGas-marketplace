'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';

export interface Seller {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  location?: { lat: number; lng: number };
  pricePerKg: number;
  availableSizes: string[];
  deliveryFee: number;
  rating?: number;
  isOnline: boolean;
  image?: string;
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function useSellers(userLat?: number, userLng?: number) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDbInstance();
    const q = query(collection(db, 'sellers'), where('isApproved', '==', true));
    
    const unsub = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Seller[];

      if (userLat && userLng) {
        data = data.sort((a, b) => {
          const distA = a.location ? getDistance(userLat, userLng, a.location.lat, a.location.lng) : 99999;
          const distB = b.location ? getDistance(userLat, userLng, b.location.lat, b.location.lng) : 99999;
          return distA - distB;
        });
      }

      setSellers(data);
      setLoading(false);
    });

    return () => unsub();
  }, [userLat, userLng]);

  return { sellers, loading };
}
