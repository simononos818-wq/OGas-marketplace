'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, limit, getDocs, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from './context/AuthContext';
import { Flame, TrendingUp, Shield, Truck, Star, MapPin, ChevronRight, ShoppingBag, Calculator } from 'lucide-react';

interface Seller {
  id: string;
  businessName: string;
  address: string;
  rating?: number;
  totalOrders?: number;
  isOnline?: boolean;
  pricePerKg?: number;
  isVerified?: boolean;
  isApproved?: boolean;
}

export default function HomePage() {
  const { loading } = useAuthContext();
  const [featuredSellers, setFeaturedSellers] = useState<Seller[]>([]);
  const [stats, setStats] = useState({ sellers: 2, orders: 0, customers: 0 });
  const [sellersLoading, setSellersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeaturedSellers();
    loadStats();
  }, []);

  const loadFeaturedSellers = async () => {
    try {
      setError(null);
      let sellers: Seller[] = [];

      // Try verified sellers first
      try {
        const q = query(collection(db, 'sellers'), where('isVerified', '==', true), limit(10));
        const snap = await getDocs(q);
        sellers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
      } catch {}

      // Fallback: approved sellers
      if (sellers.length === 0) {
        try {
          const q = query(collection(db, 'sellers'), where('isApproved', '==', true), limit(10));
          const snap = await getDocs(q);
          sellers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
        } catch {}
      }

      // Fallback: all sellers
      if (sellers.length === 0) {
        const snap = await getDocs(query(collection(db, 'sellers'), limit(10)));
        sellers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
      }

      setFeaturedSellers(sellers);
    } catch (e: any) {
      console.error('Seller load error:', e);
      setError(e.message);
    } finally {
      setSellersLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [sellersSnap, ordersSnap, usersSnap] = await Promise.allSettled([
        getCountFromServer(collection(db, 'sellers')),
        getCountFromServer(collection(db, 'orders')),
        getCountFromServer(collection(db, 'users')),
      ]);
      setStats({
        sellers: sellersSnap.status === 'fulfilled' ? sellersSnap.value.data().count : 2,
        orders: ordersSnap.status === 'fulfilled' ? ordersSnap.value.data().count : 0,
        customers: usersSnap.status === 'fulfilled' ? usersSnap.value.data().count : 0,
      });
    } catch (e) {
      console.error('Stats error:', e);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-orange-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-gradient-to-b from-orange-900/40 via-orange-950/20 to-black px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">OGas</h1>
            <p className="text-orange-400 text-sm">Gas Delivered to Your Door</p>
          </div>
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <Flame size={20} className="text-black" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/buy" className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-orange-500/50 transition">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mb-2">
              <ShoppingBag size={20} className="text-orange-500" />
            </div>
            <p className="font-bold">Buy Gas</p>
            <p className="text-xs text-gray-400">Order from sellers</p>
          </Link>
          <Link href="/calculator" className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-orange-500/50 transition">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-2">
              <Calculator size={20} className="text-blue-500" />
            </div>
            <p className="font-bold">Smart Calc</p>
            <p className="text-xs text-gray-400">How much do you need?</p>
          </Link>
        </div>

        <div className="flex items-center justify-between bg-gray-900/50 rounded-xl px-4 py-3 border border-gray-800">
          <div className="text-center">
            <p className="font-bold text-sm text-orange-400">{stats.sellers}</p>
            <p className="text-[10px] text-gray-500">Sellers</p>
          </div>
          <div className="w-px h-6 bg-gray-800" />
          <div className="text-center">
            <p className="font-bold text-sm text-orange-400">{stats.orders}</p>
            <p className="text-[10px] text-gray-500">Orders</p>
          </div>
          <div className="w-px h-6 bg-gray-800" />
          <div className="text-center">
            <p className="font-bold text-sm text-orange-400">{stats.customers}</p>
            <p className="text-[10px] text-gray-500">Users</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Featured Sellers</h2>
          <Link href="/buy" className="text-orange-400 text-sm flex items-center gap-1">
            See All <ChevronRight size={14} />
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-4 text-red-400 text-sm">
            Error: {error}
          </div>
        )}

        {sellersLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-800 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : featuredSellers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No sellers yet. Be the first!</p>
            <Link href="/seller/register" className="text-orange-400 text-sm mt-2 inline-block">Register as Seller</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {featuredSellers.map(seller => (
              <Link key={seller.id} href={`/buy/${seller.id}`} className="block bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-orange-500/50 transition">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Flame size={20} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold truncate">{seller.businessName}</h3>
                      {seller.isOnline && <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />}
                    </div>
                    <p className="text-gray-400 text-sm truncate flex items-center gap-1">
                      <MapPin size={12} className="shrink-0" /> {seller.address}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {seller.rating && seller.rating > 0 ? (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Star size={12} fill="currentColor" /> {seller.rating.toFixed(1)}
                        </span>
                      ) : null}
                      {seller.totalOrders && seller.totalOrders > 0 ? (
                        <span className="text-gray-400">{seller.totalOrders} orders</span>
                      ) : null}
                      {seller.pricePerKg ? (
                        <span className="text-orange-400 font-medium">N{seller.pricePerKg.toLocaleString()}/kg</span>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 shrink-0 mt-2" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-24">
        <div className="bg-gradient-to-r from-orange-900/20 to-gray-900 rounded-2xl p-4 border border-orange-900/30">
          <h3 className="font-bold mb-3 text-orange-400">Why OGas?</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-300"><Shield size={16} className="text-green-500" /> Verified Sellers</div>
            <div className="flex items-center gap-2 text-gray-300"><Truck size={16} className="text-blue-500" /> Fast Delivery</div>
            <div className="flex items-center gap-2 text-gray-300"><Star size={16} className="text-yellow-500" /> Quality Gas</div>
            <div className="flex items-center gap-2 text-gray-300"><TrendingUp size={16} className="text-orange-500" /> Best Prices</div>
          </div>
        </div>
      </div>
    </div>
  );
}
