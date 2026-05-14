'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { findNearbyVendors } from '@/lib/vendorService';
import Link from 'next/link';
import { MapPin, Flame, Star, Phone, ArrowLeft, SlidersHorizontal, Search, Navigation } from 'lucide-react';

export default function BuyGas() {
  const { user } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationName, setLocationName] = useState('Detecting location...');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');
  const [showFilters, setShowFilters] = useState(false);

  const gasTypes = ['all', '3kg', '5kg', '6kg', '12.5kg', '25kg', '50kg'];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationName('Your Location');
        },
        () => {
          setLocationName('Location access denied. Using default.');
          setLocation({ lat: 6.5244, lng: 3.3792 }); // Lagos fallback
        }
      );
    } else {
      setLocationName('Geolocation not supported. Using default.');
      setLocation({ lat: 6.5244, lng: 3.3792 });
    }
  }, []);

  const loadVendors = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const nearby = await findNearbyVendors(
        location.lat, 
        location.lng, 
        20,
        { isOpen: true, ...(selectedType !== 'all' && { gasType: selectedType }) }
      );
      
      let sorted = nearby;
      if (sortBy === 'price') {
        sorted = nearby.sort((a, b) => {
          const priceA = a.inventory[0]?.price || Infinity;
          const priceB = b.inventory[0]?.price || Infinity;
          return priceA - priceB;
        });
      } else if (sortBy === 'rating') {
        sorted = nearby.sort((a, b) => b.rating - a.rating);
      }
      
      setVendors(sorted);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [location, selectedType, sortBy]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const handleOrder = (vendor: any, item: any, mode: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (item.quantity < 1) {
      alert('Sorry, this item is out of stock');
      return;
    }
    const params = new URLSearchParams({
      vendor: vendor.id,
      item: item.id,
      mode,
      type: item.gasType,
      price: item.price.toString()
    });
    router.push(`/buyer/checkout?${params.toString()}`);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Flame className="w-6 h-6" />
                  Buy Gas
                </h1>
                <p className="text-xs text-orange-100 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {locationName}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-zinc-900 border-b border-zinc-800">
          <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Sort by</label>
              <div className="flex gap-2">
                {(['distance', 'price', 'rating'] as const).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setSortBy(sort)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                      sortBy === sort ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {sort}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4 w-full">
        {/* Gas Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {gasTypes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedType(size)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedType === size 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25' 
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              {size === 'all' ? 'All Sizes' : size}
            </button>
          ))}
        </div>

        {/* Results */}
        {!loading && vendors.length > 0 && (
          <p className="text-zinc-400 text-sm mb-4">
            Found <span className="text-orange-400 font-bold">{vendors.length}</span> seller{vendors.length !== 1 ? 's' : ''} near you
          </p>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800">
            <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No sellers found nearby</p>
            <p className="text-zinc-500 text-sm mb-4">Expand your search or check back later</p>
            <button 
              onClick={() => setSelectedType('all')}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition"
            >
              Show all sizes
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-800/50 to-transparent">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        {vendor.businessName}
                        {vendor.isVerified && (
                          <span className="text-green-500 text-xs bg-green-500/10 px-2 py-0.5 rounded-full">✓ Verified</span>
                        )}
                      </h3>
                      <p className="text-sm text-zinc-400 line-clamp-1 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {vendor.address}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="text-orange-400 font-medium bg-orange-400/10 px-2 py-1 rounded-lg">
                          {vendor.distance?.toFixed(1) || '?'} km away
                        </span>
                        <span className="flex items-center gap-1 text-zinc-300">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}
                          <span className="text-zinc-500">({vendor.reviewCount})</span>
                        </span>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${vendor.isOpen ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500'} animate-pulse`} />
                  </div>
                </div>

                <div className="divide-y divide-zinc-800">
                  {vendor.inventory
                    ?.filter((item: any) => selectedType === 'all' || item.gasType === selectedType)
                    .map((item: any) => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition">
                        <div>
                          <p className="font-medium text-white flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            {item.brand} {item.gasType}
                          </p>
                          <p className={`text-sm mt-1 ${item.quantity < 5 ? 'text-red-400' : 'text-zinc-500'}`}>
                            {item.quantity} in stock{item.quantity < 5 && ' - Low!'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-orange-400">₦{item.price?.toLocaleString() || '---'}</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleOrder(vendor, item, 'pickup')}
                              disabled={item.quantity < 1}
                              className="px-3 py-1.5 text-sm border border-orange-500 text-orange-400 rounded-lg hover:bg-orange-500/10 transition disabled:opacity-50"
                            >
                              Pickup
                            </button>
                            {vendor.hasDelivery && (
                              <button
                                onClick={() => handleOrder(vendor, item, 'delivery')}
                                disabled={item.quantity < 1}
                                className="px-3 py-1.5 text-sm bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-lg hover:from-orange-700 hover:to-amber-600 transition disabled:opacity-50"
                              >
                                Delivery
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
