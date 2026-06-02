"use client";

import { useState, useEffect, useCallback } from 'react';
import { detectUserLocation, findNearestCity, calculateDistance, NIGERIAN_CITIES } from '@/lib/gasCalculator';

export interface UserLocation {
  lat: number;
  lng: number;
  city: string;
  state: string;
  accuracy: number;
  detected: boolean;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation>({
    lat: 0,
    lng: 0,
    city: "Detecting...",
    state: "",
    accuracy: 0,
    detected: false,
    loading: true,
    error: null,
  });

  const detectLocation = useCallback(async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const pos = await detectUserLocation();
      const nearest = findNearestCity(pos.lat, pos.lng);
      
      setLocation({
        lat: pos.lat,
        lng: pos.lng,
        city: nearest.city.name,
        state: nearest.city.state,
        accuracy: pos.accuracy,
        detected: true,
        loading: false,
        error: null,
      });
      
      // Save to localStorage for persistence
      localStorage.setItem('ogas_location', JSON.stringify({
        lat: pos.lat,
        lng: pos.lng,
        city: nearest.city.name,
        state: nearest.city.state,
        timestamp: Date.now(),
      }));
      
    } catch (err) {
      // Try to use saved location
      const saved = localStorage.getItem('ogas_location');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const hoursSince = (Date.now() - data.timestamp) / (1000 * 60 * 60);
          
          if (hoursSince < 24) {
            setLocation({
              lat: data.lat,
              lng: data.lng,
              city: data.city,
              state: data.state,
              accuracy: 0,
              detected: true,
              loading: false,
              error: null,
            });
            return;
          }
        } catch {}
      }
      
      // Fallback to manual selection
      setLocation({
        lat: 0,
        lng: 0,
        city: "Select Location",
        state: "",
        accuracy: 0,
        detected: false,
        loading: false,
        error: "Could not detect location. Please select your city.",
      });
    }
  }, []);

  const setManualLocation = useCallback((cityName: string) => {
    const city = NIGERIAN_CITIES.find(c => c.name === cityName);
    if (!city) return;
    
    setLocation({
      lat: city.lat,
      lng: city.lng,
      city: city.name,
      state: city.state,
      accuracy: 0,
      detected: true,
      loading: false,
      error: null,
    });
    
    localStorage.setItem('ogas_location', JSON.stringify({
      lat: city.lat,
      lng: city.lng,
      city: city.name,
      state: city.state,
      timestamp: Date.now(),
    }));
  }, []);

  const getDistanceTo = useCallback((sellerLat: number, sellerLng: number) => {
    if (!location.detected) return null;
    return calculateDistance(location.lat, location.lng, sellerLat, sellerLng);
  }, [location.lat, location.lng, location.detected]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  return {
    ...location,
    detectLocation,
    setManualLocation,
    getDistanceTo,
  };
}

export default useLocation;
