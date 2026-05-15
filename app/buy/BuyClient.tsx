'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search, SlidersHorizontal, Flame } from 'lucide-react';
import BottomNav from '@/app/components/MobileNav';
import SellerCard from '@/app/components/SellerCard';
import { SkeletonCard } from '@/app/components/Skeleton';

interface Product {
  id: string;
  size: string;
  price: number;
  stock: number;
  brand: string;
}

interface Seller {
  id: string;
  businessName: string;
  address: string;
  phone: string;
  hasDelivery: boolean;
  deliveryFee?: number;
  isOnline: boolean;
  rating: number;
  reviewCount: number;
  products: Product[];
}

export default function BuyClient() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDelivery, setFilterDelivery] = useState(false);
  const [filterOnline, setFilterOnline] = useState(false);

  const fetchSellers = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'vendors'),
        where('isVerified', '==', true),
        orderBy('rating', 'desc')
      );
      const snapshot = await getDocs(q);
      const sellersData: Seller[] = [];
      
      for (const doc of snapshot.docs) {
        const vendor = doc.data();
        const invSnap = await getDocs(collection(db, 'vendors', doc.id, 'inventory'));
        const products = invSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        
        sellersData.push({
          id: doc.id,
          businessName: vendor.businessName || 'Unknown Vendor',
          address: vendor.address || 'Nigeria',
          phone: vendor.phone || '',
          hasDelivery: vendor.hasDelivery || false,
          deliveryFee: vendor.deliveryFee,
          isOnline: vendor.isOnline || false,
          rating: vendor.rating || 4.0,
          reviewCount: vendor.reviewCount || 0,
          products: products.filter(p => p.stock > 0),
        });
      }
      
      setSellers(sellersData);
      setFilteredSellers(sellersData);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  useEffect(() => {
    let filtered = sellers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.businessName.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.products.some(p => p.brand.toLowerCase().includes(q))
      );
    }
    if (filterDelivery) filtered = filtered.filter(s => s.hasDelivery);
    if (filterOnline) filtered = filtered.filter(s => s.isOnline);
    setFilteredSellers(filtered);
  }, [searchQuery, filterDelivery, filterOnline, sellers]);

  return (
    <main className="min-h-screen bg-zinc-950 pb-24">
      <header className="fixed top-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800 z-40 pt-safe">
        <div className="max-w-md mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search sellers, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                showFilters ? 'bg-orange-500 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
              }`}>
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
          
          {showFilters && (
            <div className="flex gap-2 pb-1">
              <button
                onClick={() => setFilterDelivery(!filterDelivery)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterDelivery ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}>
                Delivery Only
              </button>
              <button
                onClick={() => setFilterOnline(!filterOnline)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterOnline ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}>
                Online Now
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="pt-24 px-4 space-y-4">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : filteredSellers.length === 0 ? (
          <div className="text-center py-20">
            <Flame className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">No sellers found</p>
            <p className="text-zinc-600 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-500 font-medium">
              {filteredSellers.length} seller{filteredSellers.length !== 1 ? 's' : ''} found
            </p>
            {filteredSellers.map(seller => (
              <SellerCard key={seller.id} seller={seller} />
            ))}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
