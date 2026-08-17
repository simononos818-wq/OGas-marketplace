'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Seller {
  id: string;
  businessName: string;
  ownerName?: string;
  phone: string;
  address: string;
  location?: { lat?: number; lng?: number; latitude?: number; longitude?: number };
  geolocation?: { latitude?: number; longitude?: number };
  pricePerKg?: number;
  availableSizes?: string[];
  deliveryFee?: number;
  prices?: Record<string, number>;
  rating?: number;
  isOnline?: boolean;
  isActive?: boolean;
  isApproved?: boolean;
  isVerified?: boolean;
  image?: string;
  city?: string;
  state?: string;
  totalOrders?: number;
  distanceKm?: number;
}

export function getDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function extractCoords(seller: any): { lat: number; lng: number } | null {
  if (seller.location?.lat && seller.location?.lng) {
    return { lat: seller.location.lat, lng: seller.location.lng };
  }
  if (seller.location?.latitude && seller.location?.longitude) {
    return { lat: seller.location.latitude, lng: seller.location.longitude };
  }
  if (seller.geolocation?.latitude && seller.geolocation?.longitude) {
    return { lat: seller.geolocation.latitude, lng: seller.geolocation.longitude };
  }
  if (seller.latitude && seller.longitude) {
    return { lat: seller.latitude, lng: seller.longitude };
  }
  return null;
}

export function useSellers(userLat?: number | null, userLng?: number | null) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'sellers'),
      where('isApproved', '==', true)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        let data = snapshot.docs.map((doc) => {
          return { id: doc.id, ...doc.data() } as Seller;
        });

        data = data.filter((s) => s.isActive !== false);

        if (userLat != null && userLng != null) {
          data = data
            .map((s) => {
              const coords = extractCoords(s);
              const distanceKm = coords
                ? getDistance(userLat, userLng, coords.lat, coords.lng)
                : 99999;
              return { ...s, distanceKm };
            })
            .sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
        }

        setSellers(data);
        setLoading(false);
      },
      (err) => {
        console.error('useSellers error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userLat, userLng]);

  return { sellers, loading };
}
