"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateDistance } from '@/lib/gasCalculator';

export interface Seller {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  pricePerKg: number;
  availableSizes: number[];
  deliveryAvailable: boolean;
  deliveryFee: number;
  rating: number;
  totalOrders: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: any;
}

// Safe data normalization
function normalizeSeller(doc: any): Seller {
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: data.name || 'Unknown Seller',
    phone: data.phone || '',
    email: data.email || '',
    businessName: data.businessName || data.name || 'Unknown Seller',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    lat: Number(data.lat) || 0,
    lng: Number(data.lng) || 0,
    pricePerKg: Number(data.pricePerKg) || 0,
    availableSizes: Array.isArray(data.availableSizes) ? data.availableSizes : [],
    deliveryAvailable: !!data.deliveryAvailable,
    deliveryFee: Number(data.deliveryFee) || 0,
    rating: Number(data.rating) || 0,
    totalOrders: Number(data.totalOrders) || 0,
    isVerified: !!data.isVerified,
    isActive: !!data.isActive,
    createdAt: data.createdAt,
  };
}

export function useSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, 'sellers'),
        where('isActive', '==', true),
        where('isVerified', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(normalizeSeller);
      
      setSellers(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sellers');
      setLoading(false);
    }
  }, []);

  const getNearbySellers = useCallback((userLat: number, userLng: number, maxKm: number = 50): Seller[] => {
    return sellers
      .map(seller => ({
        ...seller,
        distance: calculateDistance(userLat, userLng, seller.lat, seller.lng),
      }))
      .filter(seller => (seller as any).distance <= maxKm)
      .sort((a, b) => (a as any).distance - (b as any).distance);
  }, [sellers]);

  const getSellersByCity = useCallback((city: string): Seller[] => {
    if (!city || city === 'Detecting...' || city === 'Select Location') return sellers;
    const cityLower = city.toLowerCase();
    return sellers.filter(s => 
      (s.city && s.city.toLowerCase() === cityLower) || 
      (s.state && s.state.toLowerCase() === cityLower)
    );
  }, [sellers]);

  const getSeller = useCallback(async (sellerId: string): Promise<Seller | null> => {
    try {
      const snap = await getDoc(doc(db, 'sellers', sellerId));
      if (!snap.exists()) return null;
      const data = normalizeSeller(snap);
      if (!data.isVerified || !data.isActive) return null;
      return data;
    } catch {
      return null;
    }
  }, []);

  const subscribeToSellers = useCallback((callback: (sellers: Seller[]) => void) => {
    const q = query(
      collection(db, 'sellers'),
      where('isActive', '==', true),
      where('isVerified', '==', true)
    );
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(normalizeSeller);
      callback(data);
      setSellers(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  return {
    sellers,
    loading,
    error,
    fetchSellers,
    getNearbySellers,
    getSellersByCity,
    getSeller,
    subscribeToSellers,
  };
}

export default useSellers;
