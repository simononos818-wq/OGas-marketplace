'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { findNearbyVendors } from '@/lib/vendorService';
import Link from 'next/link';
import { MapPin, Flame, Star, ArrowLeft, SlidersHorizontal, Search, Navigation } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function BuyGas() {
  const { user } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationName, setLocationName] = useState('Detecting...');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const gasTypes = ['all', '3kg', '5kg', '6kg', '12.5kg', '25kg', '50kg'];

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationName('Your Location');
        },
        () => {
          setLocationName('Lagos (default)');
          setLocation({ lat: 6.5244, lng: 3.3792 });
        }
      );
    } else {
      setLocation({ lat: 6.5244, lng: 3.3792 });
      setLocationName('Lagos (default)');
    }
  }, []);

  const loadVendors = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const nearby = await findNearbyVendors(location.lat, location.lng, 20, { isOpen: true });
      let sorted = nearby;
      if (sortBy === 'price') sorted = nearby.sort((a, b) => (a.inventory[0]?.price || Infinity) - (b.inventory[0]?.price || Infinity));
      else if (sortBy === 'rating') sorted = nearby.sort((a, b) => b.rating - a.rating);
      setVendors(sorted);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [location, sortBy]);

  useEffect(() => { 
    if (isClient && location) loadVendors(); 
  }, [isClient, location, loadVendors]);

  const handleOrder = (vendor: any, item: any, mode: string) => {
    if (!user) { router.push('/auth/login'); return; }
    if (item.quantity < 1) { alert('Out of stock'); return; }
    const params = new URLSearchParams({ vendor: vendor.id, item: item.id, mode, type: item.gasType, price: item.price.toString() });
    router.push(`/buyer/checkout?${params.toString()}`);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
        <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-zinc-950 pb-20">
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5" /> Buy Gas
              </h1>
              <p className="text-[10px] text-orange-100 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> {locationName}
              </p>
            </div>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
            <SlidersHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-zinc-900 border-b border-zinc-800">
          <div className="max-w-xl mx-auto px-4 py-3">
            <label className="text-xs text-zinc-400 mb-2 block">Sort by</label>
            <div className="flex gap-2">
              {(['distance', 'price', 'rating'] as const).map((sort) => (
                <button key={sort} onClick={() => setSortBy(sort)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${sortBy === sort ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                  {sort}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
          {gasTypes.map((size) => (
            <button key={size} onClick={() => setSelectedType(size)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedType === size ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'}`}>
              {size === 'all' ? 'All' : size}
            </button>
          ))}
        </div>

        {!loading && vendors.length > 0 && (
          <p className="text-zinc-400 text-xs mb-3">Found <span className="text-orange-400 font-bold">{vendors.length}</span> seller{vendors.length !== 1 ? 's' : ''}</p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 animate-pulse">
                <div className="h-5 bg-zinc-800 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-10 bg-zinc-900 rounded-xl border border-zinc-800">
            <Search className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm mb-1">No sellers found nearby</p>
            <p className="text-zinc-500 text-xs mb-3">Check back soon</p>
            <button onClick={() => setSelectedType('all')} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition">Show all</button>
          </div>
        ) : (
          <div className="space-y-3">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="p-4 border-b border-zinc-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2 truncate">
                        {vendor.businessName}
                        {vendor.isVerified && <span className="text-green-500 text-[10px] bg-green-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">✓</span>}
                      </h3>
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" /> {vendor.address}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="text-orange-400 font-medium bg-orange-400/10 px-2 py-0.5 rounded">{vendor.distance?.toFixed(1) || '?'} km</span>
                        <span className="flex items-center gap-0.5 text-zinc-300">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}
                        </span>
                      </div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${vendor.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
                <div className="divide-y divide-zinc-800">
                  {vendor.inventory?.filter((item: any) => selectedType === 'all' || item.gasType === selectedType).map((item: any) => (
                    <div key={item.id} className="p-3 flex items-center justify-between hover:bg-zinc-800/50 transition">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white flex items-center gap-1.5 truncate">
                          <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" /> {item.brand} {item.gasType}
                        </p>
                        <p className={`text-xs mt-0.5 ${item.quantity < 5 ? 'text-red-400' : 'text-zinc-500'}`}>
                          {item.quantity} left{item.quantity < 5 && ' - Low!'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-lg font-bold text-orange-400">₦{item.price?.toLocaleString()}</p>
                        <div className="flex gap-1.5 mt-1">
                          <button onClick={() => handleOrder(vendor, item, 'pickup')} disabled={item.quantity < 1}
                            className="px-2.5 py-1 text-xs border border-orange-500/50 text-orange-400 rounded-md hover:bg-orange-500/10 transition disabled:opacity-40">Pickup</button>
                          {vendor.hasDelivery && (
                            <button onClick={() => handleOrder(vendor, item, 'delivery')} disabled={item.quantity < 1}
                              className="px-2.5 py-1 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 transition disabled:opacity-40">Delivery</button>
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
