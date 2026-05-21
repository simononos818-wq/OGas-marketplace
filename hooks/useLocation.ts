'use client';

import { useState, useEffect, useCallback } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  address: string;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

const KNOWN_LOCATIONS: Record<string, { city: string; state: string }> = {
  'oteri': { city: 'Ughelli', state: 'Delta' },
  'ughelli': { city: 'Ughelli', state: 'Delta' },
  'warri': { city: 'Warri', state: 'Delta' },
  'effurun': { city: 'Warri', state: 'Delta' },
  'ikeja': { city: 'Lagos', state: 'Lagos' },
  'yaba': { city: 'Lagos', state: 'Lagos' },
  'lekki': { city: 'Lagos', state: 'Lagos' },
  'victoria island': { city: 'Lagos', state: 'Lagos' },
  'surulere': { city: 'Lagos', state: 'Lagos' },
  'gbagada': { city: 'Lagos', state: 'Lagos' },
  'oshodi': { city: 'Lagos', state: 'Lagos' },
  'apapa': { city: 'Lagos', state: 'Lagos' },
};

export function useLocation() {
  const [location, setLocation] = useState<LocationData>({
    latitude: 0, longitude: 0,
    neighborhood: '', city: '', state: '',
    country: 'Nigeria', address: '',
    loading: true, error: null, permissionDenied: false,
  });

  const detectLocation = useCallback(async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 15000, maximumAge: 600000
        });
      });

      const { latitude, longitude } = position.coords;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'OGasApp/1.0' } }
      );
      
      const data = await response.json();
      const addr = data.address || {};
      
      const neighborhood = addr.suburb || addr.neighbourhood || addr.village || 
                          addr.town || addr.hamlet || 'Unknown Area';
      const city = addr.city || addr.town || addr.county || 'Unknown City';
      const state = addr.state || 'Unknown State';
      
      const normalizedHood = neighborhood.toLowerCase();
      const known = Object.entries(KNOWN_LOCATIONS).find(([key]) => 
        normalizedHood.includes(key) || city.toLowerCase().includes(key)
      );
      
      const finalLocation = {
        latitude, longitude,
        neighborhood: known ? known[0].charAt(0).toUpperCase() + known[0].slice(1) : neighborhood,
        city: known ? known[1].city : city,
        state: known ? known[1].state : state,
        country: addr.country || 'Nigeria',
        address: data.display_name || `${neighborhood}, ${city}`,
        loading: false, error: null, permissionDenied: false,
      };

      setLocation(finalLocation);
      localStorage.setItem('ogas_location', JSON.stringify({
        ...finalLocation, timestamp: Date.now()
      }));

    } catch (error: any) {
      if (error.code === 1) {
        setLocation(prev => ({
          ...prev, loading: false,
          error: 'Location access denied. Please enable or enter manually.',
          permissionDenied: true,
        }));
      } else {
        const cached = localStorage.getItem('ogas_location');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 86400000) {
            setLocation({ ...parsed, loading: false, error: 'Using cached location.', permissionDenied: false });
            return;
          }
        }
        setLocation(prev => ({
          ...prev, loading: false,
          error: 'Could not detect location. Please enter manually.',
          permissionDenied: false,
        }));
      }
    }
  }, []);

  const setManualLocation = useCallback((neighborhood: string, city: string, state: string) => {
    const loc = {
      latitude: 0, longitude: 0,
      neighborhood, city, state,
      country: 'Nigeria', address: `${neighborhood}, ${city}, ${state}`,
      loading: false, error: null, permissionDenied: false,
    };
    setLocation(loc);
    localStorage.setItem('ogas_location', JSON.stringify({ ...loc, timestamp: Date.now() }));
  }, []);

  useEffect(() => { detectLocation(); }, [detectLocation]);

  return { ...location, detectLocation, setManualLocation };
}
