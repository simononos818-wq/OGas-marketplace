import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Seller } from '@/types';
import { calculateDistance } from '@/lib/distance';

export function useSellers(location?: string) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    let q = query(
      collection(db, 'sellers'),
      where('isActive', '==', true),
      orderBy('rating', 'desc')
    );

    if (location) {
      q = query(
        collection(db, 'sellers'),
        where('isActive', '==', true),
        where('location', '==', location),
        orderBy('rating', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Seller[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Seller);
        });
        setSellers(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching sellers:', err);
        setError('Failed to load sellers');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [location]);

  // NEW: Filter sellers by GPS distance
  const getNearbySellers = useCallback((
    userLat: number,
    userLng: number,
    maxKm: number = 20
  ) => {
    return sellers
      .map((seller) => {
        // Check if seller has GPS coordinates
        const sellerLoc = (seller as any).gpsLocation || (seller as any).location;
        if (!sellerLoc || typeof sellerLoc.latitude !== 'number') {
          return { ...seller, distance: 999 };
        }
        const dist = calculateDistance(
          userLat, userLng,
          sellerLoc.latitude, sellerLoc.longitude
        );
        return { ...seller, distance: dist };
      })
      .filter((s: any) => s.distance <= maxKm)
      .sort((a: any, b: any) => a.distance - b.distance);
  }, [sellers]);

  const getSellersByCity = useCallback((city: string) => {
    if (!city) return sellers;
    return sellers.filter((s) => 
      s.address?.toLowerCase().includes(city.toLowerCase()) ||
      (s as any).city?.toLowerCase().includes(city.toLowerCase())
    );
  }, [sellers]);

  return { sellers, loading, error, getNearbySellers, getSellersByCity };
}
