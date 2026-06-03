'use client';

import { useState, useCallback, useEffect } from 'react';
import { CITY_COORDS } from '@/lib/distance';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address: string;
  accuracy: number | null;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState(false);

  // Load saved location on mount
  useEffect(() => {
    const saved = localStorage.getItem('ogas_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng) {
          setLocation({
            latitude: parsed.lat,
            longitude: parsed.lng,
            address: parsed.address || `${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)}`,
            accuracy: null,
          });
          setDetected(true);
        }
      } catch {}
    }
  }, []);

  const getCurrentLocation = useCallback((): Promise<UserLocation | null> => {
    return new Promise((resolve) => {
      setLoading(true);
      setError(null);

      if (!navigator.geolocation) {
        setError('Geolocation not supported. Use manual entry.');
        setLoading(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
            accuracy: position.coords.accuracy,
          };
          setLocation(result);
          setDetected(true);
          setLoading(false);
          localStorage.setItem('ogas_location', JSON.stringify({
            lat: result.latitude,
            lng: result.longitude,
            address: result.address,
          }));
          resolve(result);
        },
        (err) => {
          let msg = 'Could not get location';
          if (err.code === 1) msg = 'Location permission denied. Enable location access or enter manually.';
          if (err.code === 2) msg = 'Location unavailable. Try manual entry.';
          if (err.code === 3) msg = 'Location request timed out.';
          setError(msg);
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  }, []);

  const setManualLocation = useCallback((cityName: string, address?: string) => {
    const key = cityName.toLowerCase().trim();
    const coords = CITY_COORDS[key] || [5.5, 5.8];
    const result: UserLocation = {
      latitude: coords[0],
      longitude: coords[1],
      address: address || cityName,
      accuracy: null,
    };
    setLocation(result);
    setDetected(true);
    setError(null);
    localStorage.setItem('ogas_location', JSON.stringify({
      lat: result.latitude,
      lng: result.longitude,
      address: result.address,
    }));
  }, []);

  // Derive city/state from address for backward compatibility
  const city = location?.address?.split(',')[0] || 'Unknown';
  const state = location?.address?.split(',')[1]?.trim() || '';

  return {
    location,
    city,
    state,
    detected,
    loading,
    error,
    getCurrentLocation,
    setManualLocation,
  };
}
