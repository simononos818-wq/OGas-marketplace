import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Seller {
  id: string;
  businessName: string;
  location: {
    lat: number;
    lng: number;
  };
  products: Array<{
    type: string;
    size: string;
    price: number;
  }>;
  rating: number;
  distance?: number; // in km
}

export function useNearbySellers(maxDistance: number = 10) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getCurrentLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          resolve(location);
        },
        (err) => {
          reject(new Error(`Location error: ${err.message}`));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const findNearbySellers = async () => {
    setLoading(true);
    setError('');

    try {
      // Get user location first
      const location = await getCurrentLocation();
      
      // Fetch all active sellers from Firestore
      const sellersRef = collection(db, 'sellers');
      const q = query(sellersRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);

      const nearbySellers: Seller[] = [];

      snapshot.forEach((doc) => {
        const seller = doc.data() as Seller;
        seller.id = doc.id;

        // Calculate distance if seller has location
        if (seller.location && seller.location.lat && seller.location.lng) {
          const distance = calculateDistance(
            location.lat,
            location.lng,
            seller.location.lat,
            seller.location.lng
          );

          if (distance <= maxDistance) {
            seller.distance = Math.round(distance * 10) / 10; // Round to 1 decimal
            nearbySellers.push(seller);
          }
        }
      });

      // Sort by distance
      nearbySellers.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setSellers(nearbySellers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    sellers,
    loading,
    error,
    userLocation,
    findNearbySellers,
    getCurrentLocation
  };
}
