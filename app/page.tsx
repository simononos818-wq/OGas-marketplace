'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from './context/AuthContext';
import { MapPin, Search, Star, Phone, Navigation, Store, Loader2, Tag, Flame } from 'lucide-react';
import Link from 'next/link';
import { useSellers, extractCoords, getDistance } from './hooks/useSellers';

export default function HomePage() {
  const { user } = useAuthContext();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const { sellers, loading } = useSellers(
    userLocation?.lat ?? null,
    userLocation?.lng ?? null
  );

  const filtered = sellers
    .filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.businessName?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.state?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'price') {
        return (a.pricePerKg || 9999) - (b.pricePerKg || 9999);
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });

  const getPrice = (s: any) => {
    if (s.pricePerKg && !isNaN(s.pricePerKg)) return s.pricePerKg;
    if (s.prices) {
      const vals = Object.values(s.prices).filter((v) => typeof v === 'number') as number[];
      if (vals.length) return vals[0];
    }
    return 1600;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Promo Banner */}
      <div className="bg-orange-500 text-black px-4 py-2.5 text-center text-sm font-bold flex items-center justify-center gap-2">
        <Flame className="w-4 h-4" />
        OGas Promo: Save ₦50/kg on every order today!
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">OGas</h1>
            <p className="text-xs text-gray-400">
              {locationStatus === 'granted'
                ? 'Showing nearest sellers'
                : locationStatus === 'denied'
                ? 'Location off — showing all sellers'
                : 'Detecting your location...'}
            </p>
          </div>
          <Link
            href={user ? '/orders' : '/login'}
            className="text-sm text-orange-400 font-medium"
          >
            {user ? 'My Orders' : 'Login'}
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, area or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Sort pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {(['distance', 'price', 'rating'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                sortBy === key
                  ? 'bg-orange-500 text-black'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              {key === 'distance' ? 'Nearest' : key === 'price' ? 'Lowest Price' : 'Top Rated'}
            </button>
          ))}
        </div>
      </div>

      {/* Seller list */}
      <div className="px-4 pt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No sellers found</p>
            <p className="text-sm mt-1">Try a different search or enable location</p>
          </div>
        ) : (
          filtered.map((seller) => {
            const price = getPrice(seller);
            const discountPrice = Math.max(price - 50, 0);
            let distanceText = '';

            if (userLocation && seller.distanceKm != null && seller.distanceKm < 99999) {
              distanceText =
                seller.distanceKm < 1
                  ? `${Math.round(seller.distanceKm * 1000)} m away`
                  : `${seller.distanceKm.toFixed(1)} km away`;
            }

            return (
              <Link
                key={seller.id}
                href={`/buy/${seller.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-orange-500/50 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg group-hover:text-orange-400 transition truncate">
                        {seller.businessName}
                      </h3>
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          seller.isOnline ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{seller.address}</span>
                    </div>

                    {distanceText && (
                      <div className="flex items-center gap-1 text-xs text-orange-400 mt-1.5 font-medium">
                        <Navigation className="w-3 h-3" />
                        {distanceText}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2.5">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{seller.rating || 4.5}</span>
                        <span className="text-xs text-gray-500">
                          ({seller.totalOrders || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Phone className="w-3.5 h-3.5" />
                        {seller.phone}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-2">
                      <Tag className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">
                        Save ₦50/kg with OGas
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-500 line-through">₦{price}/kg</div>
                    <div className="text-lg font-bold text-orange-400">
                      ₦{discountPrice}
                      <span className="text-xs text-gray-500 font-normal">/kg</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Delivery ₦{seller.deliveryFee || 500}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
