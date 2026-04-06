'use client';

import { useEffect, useState } from 'react';
import { useNearbySellers } from '@/hooks/useNearbySellers';
import { MapPin, RefreshCw, Store } from 'lucide-react';
import Link from 'next/link';

export default function BuyerPage() {
  const { sellers, loading, error, userLocation, findNearbySellers } = useNearbySellers(10);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    // Check location permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state as any);
        if (result.state === 'granted') {
          findNearbySellers();
        }
      });
    }
  }, []);

  const handleEnableLocation = async () => {
    try {
      await findNearbySellers();
      setLocationPermission('granted');
    } catch (err) {
      setLocationPermission('denied');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Find Gas Nearby</h1>
          <button 
            onClick={findNearbySellers}
            disabled={loading}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded-full"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Location Status */}
        {locationPermission === 'denied' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900">Location Access Required</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please enable location access in your browser settings to find nearby gas sellers.
                </p>
                <button 
                  onClick={handleEnableLocation}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {locationPermission === 'prompt' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Enable Location</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Allow location access to find gas sellers near you.
                </p>
                <button 
                  onClick={handleEnableLocation}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Enable Location
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-3 text-gray-600">Finding nearby sellers...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Sellers List */}
        {!loading && sellers.length === 0 && locationPermission === 'granted' && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No sellers nearby</h3>
            <p className="text-gray-500 mt-2">Try expanding your search area or check back later.</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller) => (
            <Link 
              key={seller.id}
              href={`/buy?supplier=${seller.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{seller.businessName}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {seller.distance} km away
                  </p>
                </div>
                <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-medium">
                  {seller.rating} ★
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {seller.products?.slice(0, 3).map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{product.type} {product.size}</span>
                    <span className="font-medium text-gray-900">₦{product.price}</span>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors">
                Order Now
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
