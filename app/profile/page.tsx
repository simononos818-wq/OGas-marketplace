'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '../context/AuthContext';
import { User, LogOut, Package, MapPin, Phone, Mail, ChevronRight, Store, Shield } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  items: any[];
  createdAt: any;
  sellerName: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, userData, loading, signOut, isSeller } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadOrders();
    }
  }, [user, loading]);

  const loadOrders = async () => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('buyerId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-orange-500">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-b from-orange-900/30 to-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <User size={32} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{userData?.name || user.displayName || 'User'}</h1>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Shield size={12} className="text-green-500" />
                <span className="text-xs text-green-500">Verified</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <Package size={20} className="text-orange-500 mx-auto mb-1" />
            <p className="font-bold">{orders.length}</p>
            <p className="text-[10px] text-gray-500">Orders</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <MapPin size={20} className="text-blue-500 mx-auto mb-1" />
            <p className="font-bold">{userData?.addresses?.length || 0}</p>
            <p className="text-[10px] text-gray-500">Addresses</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <Phone size={20} className="text-green-500 mx-auto mb-1" />
            <p className="font-bold text-xs truncate">{userData?.phone || 'N/A'}</p>
            <p className="text-[10px] text-gray-500">Phone</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <MenuItem icon={<Package size={18} />} label="My Orders" href="/orders" />
          <MenuItem icon={<MapPin size={18} />} label="Saved Addresses" href="#" />
          <MenuItem icon={<Mail size={18} />} label="Support" href="mailto:support@ogas.com.ng" />
          
          {isSeller && (
            <MenuItem icon={<Store size={18} />} label="Seller Dashboard" href="/seller/dashboard" />
          )}
          
          {!isSeller && (
            <MenuItem icon={<Store size={18} />} label="Become a Seller" href="/seller/register" />
          )}
        </div>

        <div className="mb-6">
          <h2 className="font-bold mb-3">Recent Orders</h2>
          {ordersLoading ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="bg-gray-900 rounded-xl p-4 animate-pulse h-16" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p>No orders yet</p>
              <Link href="/buy" className="text-orange-400 text-sm mt-2 inline-block">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 3).map(order => (
                <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{order.sellerName || 'Unknown Seller'}</p>
                    <p className="text-xs text-gray-500">{order.items?.map((i: any) => i.size).join(', ')}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${
                      order.status === 'completed' ? 'bg-green-900/30 text-green-500' :
                      order.status === 'paid' ? 'bg-blue-900/30 text-blue-500' :
                      'bg-orange-900/30 text-orange-500'
                    }`}>{order.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">N{order.totalAmount?.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">{order.createdAt?.toDate?.().toLocaleDateString() || 'Recent'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => { signOut(); router.push('/'); }}
          className="w-full bg-red-900/20 border border-red-500/30 text-red-400 font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-900/30 transition"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-orange-500/30 transition">
      <div className="flex items-center gap-3 text-gray-300">
        <span className="text-orange-500">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight size={16} className="text-gray-600" />
    </Link>
  );
}
