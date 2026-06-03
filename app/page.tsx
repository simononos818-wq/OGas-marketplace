"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocation } from '@/hooks/useLocation';
import { useSellers } from '@/hooks/useSellers';
import { formatPrice, NIGERIAN_CITIES } from '@/lib/gasCalculator';
import { calculateDistance, estimateDeliveryTime } from '@/lib/distance';
import { MapPin, Flame, Star, Truck, ChevronRight, Navigation, LocateFixed } from 'lucide-react';

export default function HomePage() {
  const { location, detected, loading: locLoading, error: locError, getCurrentLocation, setManualLocation } = useLocation();
  const { sellers, loading: sellersLoading, getNearbySellers, getSellersByCity } = useSellers();
  const [nearbySellers, setNearbySellers] = useState<any[]>([]);
  const [showCityPicker, setShowCityPicker] = useState(false);

  // When location is detected, find nearby sellers by GPS or city
  useEffect(() => {
    if (detected && sellers.length > 0) {
      if (location) {
        // Try GPS-based nearby first
        const nearby = getNearbySellers(location.latitude, location.longitude, 20);
        if (nearby.length > 0) {
          setNearbySellers(nearby);
          return;
        }
      }
      // Fallback to city-based
      const citySellers = getSellersByCity(location?.address || '');
      setNearbySellers(citySellers);
    }
  }, [detected, sellers, location, getNearbySellers, getSellersByCity]);

  const handleCitySelect = (cityName: string) => {
    setManualLocation(cityName);
    setShowCityPicker(false);
  };

  const handleDetectGPS = async () => {
    await getCurrentLocation();
  };

  const displaySellers = nearbySellers.length > 0 ? nearbySellers : sellers.slice(0, 10);
  const isLoading = locLoading || sellersLoading;

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-900/20 to-black px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">OGas</h1>
            <p className="text-orange-400 text-sm">Order Gas, Delivered</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
        </div>

        {/* Location Bar */}
        <div className="space-y-2">
          <button
            onClick={handleDetectGPS}
            disabled={locLoading}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            <LocateFixed className="w-4 h-4" />
            {locLoading ? 'Detecting location...' : 'Detect My Location'}
          </button>

          {locError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{locError}</p>
              <button
                onClick={() => setShowCityPicker(!showCityPicker)}
                className="text-orange-400 text-sm font-medium mt-1 hover:underline"
              >
                {showCityPicker ? 'Hide city picker' : 'Pick a city instead'}
              </button>
            </div>
          )}

          {showCityPicker && (
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
              <p className="text-gray-400 text-xs mb-2">Select your city:</p>
              <div className="grid grid-cols-2 gap-2">
                {NIGERIAN_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className="text-left text-sm text-gray-300 hover:text-orange-400 hover:bg-gray-800 py-2 px-3 rounded-lg transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm truncate">{location.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sellers List */}
      <div className="px-4 pt-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displaySellers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No sellers found nearby</p>
            <p className="text-gray-600 text-sm mt-1">Try detecting your location or selecting a city</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">
                {nearbySellers.length > 0 ? 'Nearby Sellers' : 'All Sellers'}
              </h2>
              <span className="text-gray-500 text-sm">{displaySellers.length} found</span>
            </div>

            {displaySellers.map((seller: any) => (
              <Link
                key={seller.id}
                href={`/buy/seller/detail?id=${seller.id}`}
                className="block bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-orange-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{seller.businessName || seller.name}</h3>
                      {seller.isVerified && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{seller.address}</p>
                    
                    {/* Distance badge */}
                    {seller.distance && seller.distance < 999 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Navigation className="w-3 h-3 text-orange-400" />
                        <span className="text-orange-400 text-xs font-medium">
                          {seller.distance.toFixed(1)} km away
                        </span>
                        <span className="text-gray-600 text-xs">
                          ({estimateDeliveryTime(seller.distance)})
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-gray-400 text-xs">
                          {seller.rating > 0 ? `${seller.rating} (${seller.reviewCount})` : 'New'}
                        </span>
                      </div>
                      {seller.deliveryAvailable && (
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3 text-blue-400" />
                          <span className="text-blue-400 text-xs">Delivers</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-bold text-lg">
                      ₦{formatPrice(seller.pricePerKg || 0)}
                      <span className="text-gray-500 text-xs font-normal">/kg</span>
                    </p>
                    <ChevronRight className="w-5 h-5 text-gray-600 mt-2 ml-auto" />
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
// OGas Marketplace - Production Ready
// OGas - Wed Jun  3 18:22:59 WAT 2026
// trigger
