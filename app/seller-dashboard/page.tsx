'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Users, Star, DollarSign, Plus, MapPin, Phone, Flame, TrendingUp } from 'lucide-react';
import { auth, db } from '@/app/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

type Order = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  total: number;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: string;
  address: string;
  items: { name: string; qty: number; price: number }[];
};

export default function SellerDashboard() {
  const [seller, setSeller] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ revenue: 0, totalOrders: 0, customers: 0, rating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      
      const sellerDoc = await getDoc(doc(db, 'sellers', user.uid));
      if (sellerDoc.exists()) setSeller(sellerDoc.data());

      const q = query(collection(db, 'orders'), where('sellerId', '==', user.uid));
      const unsubOrders = onSnapshot(q, (snapshot) => {
        const ordersData: Order[] = [];
        let revenue = 0;
        const customers = new Set();

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as Order;
          ordersData.push({ ...data, id: doc.id });
          if (data.status === 'delivered') revenue += data.total;
          customers.add(data.buyerName);
        });

        setOrders(ordersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setStats({
          revenue,
          totalOrders: ordersData.length,
          customers: customers.size,
          rating: sellerDoc.data()?.rating || 0,
        });
        setLoading(false);
      });

      return () => unsubOrders();
    });
    return () => unsub();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-400';
      case 'confirmed': return 'bg-blue-500/10 text-blue-400';
      case 'out_for_delivery': return 'bg-purple-500/10 text-purple-400';
      case 'delivered': return 'bg-green-500/10 text-green-400';
      case 'cancelled': return 'bg-red-500/10 text-red-400';
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-zinc-400">Welcome back, {seller?.name || 'Seller'}</p>
            {seller?.verified && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full mt-2">
                <Star className="w-3 h-3" /> Verified Seller
              </span>
            )}
          </div>
          <Link href="/vendor/register" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Revenue', value: `₦${stats.revenue.toLocaleString()}`, change: '+12%', icon: DollarSign },
            { label: 'Orders', value: stats.totalOrders.toString(), change: '+8%', icon: Package },
            { label: 'Customers', value: stats.customers.toString(), change: '+24', icon: Users },
            { label: 'Rating', value: stats.rating.toString() || '0.0', change: '+0.2', icon: Star },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-zinc-500">{stat.label}</div>
                <div className="text-xs text-green-400 mt-2">{stat.change}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Recent Orders</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No orders yet</p>
                <p className="text-sm mt-1">Orders appear when customers buy your gas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">#{order.id.slice(-4)} - {order.buyerName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>{order.status.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {order.buyerPhone}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.address}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-white">₦{order.total.toLocaleString()}</p>
                      <p className="text-xs text-zinc-500">{order.items?.length || 0} item(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/vendor/register" className="block w-full p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors">
                  <p className="font-medium text-white">Update Inventory</p>
                  <p className="text-xs text-zinc-500 mt-1">Add or edit gas products</p>
                </Link>
                <button className="block w-full p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors text-left">
                  <p className="font-medium text-white">Withdraw Earnings</p>
                  <p className="text-xs text-zinc-500 mt-1">Transfer to bank account</p>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white">Gas Calculator</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">Calculate refill costs for customers</p>
              <Link href="/buy" className="text-sm text-orange-400 hover:text-orange-300">Open Calculator →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
