"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocation } from '@/hooks/useLocation';
import { useSellers } from '@/hooks/useSellers';
import { formatPrice, NIGERIAN_CITIES } from '@/lib/gasCalculator';
import { calculateDistance, estimateDeliveryTime } from '@/lib/distance';
import { MapPin, Star, Truck, Search, SlidersHorizontal, Flame, ChevronLeft, LocateFixed } from 'lucide-react';

export default function BuyPage() {
  const { location, city, state, detected, loading: locLoading, error: locError, getCurrentLocation, setManualLocation } = useLocation();
  const { sellers, loading: sellersLoading, getNearbySellers, getSellersByCity } = useSellers();
  const [filteredSellers, setFilteredSellers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('distance');

  useEffect(() => {
    let result = [...sellers];

    if (detected && location) {
      const nearby = getNearbySellers(location.latitude, location.longitude, 200);
      if (nearby.length > 0) result = nearby;
      else result = getSellersByCity(city);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.businessName?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
      );
    }

    if (selectedCity) {
      result = getSellersByCity(selectedCity);
    }

    if (minPrice) result = result.filter(s => s.pricePerKg >= Number(minPrice));
    if (maxPrice) result = result.filter(s => s.pricePerKg <= Number(maxPrice));
    if (deliveryOnly) result = result.filter(s => s.deliveryAvailable);

    result.sort((a, b) => {
      if (sortBy === 'price') return a.pricePerKg - b.pricePerKg;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return ((a as any).distance || 999) - ((b as any).distance || 999);
    });

    setFilteredSellers(result);
  }, [sellers, detected, location, city, searchQuery, selectedCity, minPrice, maxPrice, deliveryOnly, sortBy, getNearbySellers, getSellersByCity]);

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    setManualLocation(cityName);
    setShowFilters(false);
  };

  const handleDetectLocation = async () => {
    await getCurrentLocation();
  };

  const loading = locLoading || sellersLoading;

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="bg-gradient-to-b from-orange-900/20 to-black px-4 pt-6 pb-4 sticky top-0 z-40">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="text-gray-400">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Buy Gas</h1>
            <p className="text-gray-500 text-xs">{city}{state ? `, ${state}` : ''}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search sellers, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#12121A] border border-[#2A2A3A] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition-colors ${showFilters ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'bg-[#12121A] border-[#2A2A3A] text-gray-400'}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {!detected && !locLoading && (
          <button
            onClick={handleDetectLocation}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors mb-3"
          >
            <LocateFixed className="w-4 h-4" />
            Detect My Location
          </button>
        )}

        {locError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-3">
            <p className="text-red-400 text-xs">{locError}</p>
          </div>
        )}

        {showFilters && (
          <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 space-y-3">
            <div>
              <p className="text-gray-500 text-xs mb-2">City</p>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full bg-black border border-[#2A2A3A] rounded-lg px-3 py-2 text-white text-sm outline-none"
              >
                <option value="">All Cities</option>
                {NIGERIAN_CITIES.map((c: any) => (
                  <option key={c.name} value={c.name}>{c.name}, {c.state}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500 text-xs mb-2">Min Price (₦/kg)</p>
                <input type="number" placeholder="1000" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full bg-black border border-[#2A2A3A] rounded-lg px-3 py-2 text-white text-sm outline-none" />
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-2">Max Price (₦/kg)</p>
                <input type="number" placeholder="2000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full bg-black border border-[#2A2A3A] rounded-lg px-3 py-2 text-white text-sm outline-none" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-gray-400 text-sm">
                <input type="checkbox" checked={deliveryOnly} onChange={(e) => setDeliveryOnly(e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-black text-orange-500" />
                Delivery only
              </label>
            </div>

            <div>
              <p className="text-gray-500 text-xs mb-2">Sort by</p>
              <div className="flex gap-2">
                {(['distance', 'price', 'rating'] as const).map((sort) => (
                  <button key={sort} onClick={() => setSortBy(sort)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${sortBy === sort ? 'bg-orange-500 text-white' : 'bg-black text-gray-400 border border-[#2A2A3A]'}`}>
                    {sort}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2">
        <p className="text-gray-500 text-xs mb-3">
          {loading ? 'Loading sellers...' : `${filteredSellers.length} seller${filteredSellers.length !== 1 ? 's' : ''} found`}
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-8 text-center">
            <Flame className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-2">No sellers found</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCity(''); setMinPrice(''); setMaxPrice(''); setDeliveryOnly(false); }} className="text-orange-400 text-sm font-medium">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSellers.map((seller: any) => (
              <Link key={seller.id} href={`/buy/seller/detail?id=${seller.id}`} className="block bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 active:scale-[0.98] transition-transform hover:border-orange-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center shrink-0">
                    <Flame className="w-6 h-6 text-orange-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-white font-semibold text-sm truncate">{seller.businessName || seller.name}</h3>
                      <span className="text-orange-400 font-bold text-sm">₦{formatPrice(seller.pricePerKg)}<span className="text-gray-500 text-xs font-normal">/kg</span></span>
                    </div>
                    
                    <p className="text-gray-500 text-xs flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" />
                      {seller.address || 'Unknown location'}
                      {seller.distance > 0 && seller.distance < 999 && (
                        <span className="text-orange-400">• {seller.distance.toFixed(1)}km ({estimateDeliveryTime(seller.distance)})</span>
                      )}
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-yellow-500">
                        <Star className="w-3 h-3 fill-yellow-500" />
                        {seller.rating || '4.5'}
                      </span>
                      {seller.deliveryAvailable && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <Truck className="w-3 h-3" /> Delivery
                        </span>
                      )}
                      {seller.isVerified && (
                        <span className="text-xs text-blue-400">Verified</span>
                      )}
                    </div>
                    
                    {seller.availableSizes && seller.availableSizes.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {seller.availableSizes.slice(0, 4).map((size: number) => (
                          <span key={size} className="text-xs bg-black border border-[#2A2A3A] text-gray-400 px-2 py-0.5 rounded">{size}kg</span>
                        ))}
                        {seller.availableSizes.length > 4 && (
                          <span className="text-xs text-gray-500 px-1">+{seller.availableSizes.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 z-50">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2 text-gray-400 hover:text-orange-400">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/buy" className="flex flex-col items-center p-2 text-orange-500">
            <span className="text-xl">🔥</span>
            <span className="text-xs font-medium">Buy</span>
          </Link>
          <Link href="/orders" className="flex flex-col items-center p-2 text-gray-400 hover:text-orange-400">
            <span className="text-xl">📦</span>
            <span className="text-xs font-medium">Orders</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center p-2 text-gray-400 hover:text-orange-400">
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
