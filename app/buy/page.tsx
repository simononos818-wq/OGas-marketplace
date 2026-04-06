'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { findNearbyVendors } from '@/lib/vendorService';
import { useAuth } from '@/contexts/AuthContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { VendorCardSkeleton } from '@/components/LoadingSkeleton';
import { showToast, ToastContainer } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, SlidersHorizontal, Flame } from 'lucide-react';

export default function BuyGas() {
  const { user } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          showToast('Location found! Finding nearby vendors...', 'success');
        },
        () => {
          setLocationError('Using default location (Lagos)');
          setLocation({ lat: 6.5244, lng: 3.3792 });
          showToast('Please enable location for better results', 'info');
        }
      );
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
      if (nearby.length === 0) {
        showToast('No vendors found. Try expanding your search.', 'info');
      }
    } catch (err) {
      showToast('Failed to load vendors. Please try again.', 'error');
      console.error(err);
    }
    setLoading(false);
  }, [location, selectedType, sortBy]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const { isRefreshing, pullDistance } = usePullToRefresh(loadVendors);

  const handleOrder = (vendor: any, item: any, mode: string) => {
    if (!user) {
      showToast('Please sign in first', 'info');
      router.push('/auth/login');
      return;
    }
    if (item.quantity < 1) {
      showToast('Sorry, this item is out of stock', 'error');
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

  const gasTypes = ['all', '3kg', '5kg', '6kg', '12.5kg', '25kg', '50kg'];

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <ToastContainer />
      
      {/* Pull to refresh indicator */}
      <motion.div 
        style={{ height: pullDistance }}
        className="flex items-center justify-center overflow-hidden"
      >
        {pullDistance > 0 && (
          <motion.div 
            animate={{ rotate: isRefreshing ? 360 : pullDistance * 2 }}
            transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0 }}
            className="text-green-500"
          >
            <Flame className="w-8 h-8" />
          </motion.div>
        )}
      </motion.div>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-6 h-6" />
                Buy Gas
              </h1>
              {locationError && (
                <p className="text-xs text-orange-100 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {locationError}
                </p>
              )}
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
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-zinc-900 border-b border-zinc-800 overflow-hidden"
          >
            <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Sort by</label>
                <div className="flex gap-2">
                  {(['distance', 'price', 'rating'] as const).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                        sortBy === sort 
                          ? 'bg-green-600 text-white' 
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {sort}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Gas Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {gasTypes.map((size) => (
            <motion.button
              key={size}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType(size)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedType === size 
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/25' 
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              {size === 'all' ? 'All Sizes' : size}
            </motion.button>
          ))}
        </div>

        {/* Results count */}
        {!loading && vendors.length > 0 && (
          <p className="text-zinc-400 text-sm mb-4">
            Found <span className="text-green-400 font-bold">{vendors.length}</span> vendor{vendors.length !== 1 ? 's' : ''} nearby
          </p>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <VendorCardSkeleton key={i} />)}
          </div>
        ) : vendors.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800"
          >
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-zinc-500" />
            </div>
            <p className="text-zinc-400 mb-2">No vendors found nearby</p>
            <p className="text-zinc-500 text-sm mb-4">Try adjusting your filters or expanding search radius</p>
            <button 
              onClick={() => { setSelectedType('all'); loadVendors(); }}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
            >
              Show all vendors
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {vendors.map((vendor, index) => (
                <motion.div 
                  key={vendor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl"
                >
                  {/* Vendor Header */}
                  <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-800/50 to-transparent">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                          {vendor.businessName}
                          {vendor.isVerified && (
                            <span className="text-green-500 text-xs bg-green-500/10 px-2 py-0.5 rounded-full">
                              ✓ Verified
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-zinc-400 line-clamp-1 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {vendor.address}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className="text-green-400 font-medium bg-green-400/10 px-2 py-1 rounded-lg">
                            {vendor.distance.toFixed(1)} km away
                          </span>
                          <span className="flex items-center gap-1 text-zinc-300">
                            ⭐ {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}
                            <span className="text-zinc-500">({vendor.reviewCount})</span>
                          </span>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${vendor.isOpen ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500'} animate-pulse`} />
                    </div>
                  </div>

                  {/* Inventory */}
                  <div className="divide-y divide-zinc-800">
                    {vendor.inventory
                      .filter((item: any) => selectedType === 'all' || item.gasType === selectedType)
                      .map((item: any) => (
                        <motion.div 
                          key={item.id} 
                          whileHover={{ backgroundColor: 'rgba(39, 39, 42, 0.5)' }}
                          className="p-4 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="font-medium text-white flex items-center gap-2">
                              <Flame className="w-4 h-4 text-orange-500" />
                              {item.brand} {item.gasType}
                            </p>
                            <p className={`text-sm mt-1 ${item.quantity < 5 ? 'text-red-400' : 'text-zinc-500'}`}>
                              {item.quantity} in stock
                              {item.quantity < 5 && ' - Low stock!'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-400">
                              ₦{item.price.toLocaleString()}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleOrder(vendor, item, 'pickup')}
                                disabled={item.quantity < 1}
                                className="px-3 py-1.5 text-sm border border-green-500 text-green-400 rounded-lg hover:bg-green-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Pickup
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleOrder(vendor, item, 'delivery')}
                                disabled={item.quantity < 1}
                                className="px-3 py-1.5 text-sm bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Delivery
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
