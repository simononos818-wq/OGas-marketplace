'use client';

import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Flame, Package, Phone, MapPin, Clock, CheckCircle, Truck, Star, LogOut, ChevronRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  buyerPhone: string;
  buyerAddress: string;
  items: { size: string; quantity: number; price: number }[];
  totalAmount: number;
  deliveryFee: number;
  deliveryType: string;
  status: string;
  paymentStatus: string;
  paystackRef: string;
  createdAt: any;
}

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSeller, setIsSeller] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sellerData, setSellerData] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    
    getDoc(doc(db, 'sellers', user.uid)).then((snap) => {
      setIsSeller(snap.exists());
      if (snap.exists()) setSellerData(snap.data());
      setChecking(false);
    });
  }, [user]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-orange-500 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Please sign in</p>
          <a href="/seller/login" className="bg-orange-500 text-black font-bold px-6 py-3 rounded-xl">Sign In</a>
        </div>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">You are not registered as a seller</p>
          <a href="/seller/register" className="bg-orange-500 text-black font-bold px-6 py-3 rounded-xl">Register as Seller</a>
        </div>
      </div>
    );
  }

  return <SellerDashboardContent userId={user.uid} sellerData={sellerData} />;
}

function SellerDashboardContent({ userId, sellerData }: { userId: string; sellerData: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, delivered: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'active' | 'completed'>('new');
  const router = useRouter();

  useEffect(() => {
    // Real-time orders listener
    const q = query(
      collection(db, 'orders'),
      where('sellerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList: Order[] = [];
      let totalRevenue = 0;
      let pendingCount = 0;
      let confirmedCount = 0;
      let deliveredCount = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data() as Order;
        const order = { ...data, id: doc.id };
        ordersList.push(order);
        
        if (order.status === 'paid' || order.status === 'pending_payment') pendingCount++;
        else if (order.status === 'confirmed' || order.status === 'out_for_delivery') confirmedCount++;
        else if (order.status === 'delivered' || order.status === 'completed') {
          deliveredCount++;
          totalRevenue += order.totalAmount || 0;
        }
      });

      setOrders(ordersList);
      setStats({
        total: ordersList.length,
        pending: pendingCount,
        confirmed: confirmedCount,
        delivered: deliveredCount,
        revenue: totalRevenue
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (err) {
      console.error('Failed to update order:', err);
      alert('Failed to update order. Try again.');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'new') return order.status === 'pending_payment' || order.status === 'paid' || order.status === 'pending';
    if (activeTab === 'active') return order.status === 'confirmed' || order.status === 'out_for_delivery';
    if (activeTab === 'completed') return order.status === 'delivered' || order.status === 'completed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
      case 'pending_payment': return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';
      case 'confirmed': return 'bg-purple-900/30 text-purple-400 border-purple-500/30';
      case 'out_for_delivery': return 'bg-orange-900/30 text-orange-400 border-orange-500/30';
      case 'delivered': return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'completed': return 'bg-green-900/30 text-green-500 border-green-500/30';
      default: return 'bg-gray-900/30 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'Awaiting Payment';
      case 'paid': return 'Paid - Confirm Order';
      case 'confirmed': return 'Confirmed - Deliver';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'paid': return { label: 'Confirm Order', next: 'confirmed', icon: CheckCircle };
      case 'confirmed': return { label: 'Out for Delivery', next: 'out_for_delivery', icon: Truck };
      case 'out_for_delivery': return { label: 'Mark Delivered', next: 'delivered', icon: CheckCircle };
      case 'delivered': return { label: 'Complete Order', next: 'completed', icon: Star };
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-900/30 to-black px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Flame size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{sellerData?.businessName || 'My Store'}</h1>
              <p className="text-xs text-gray-400">{sellerData?.address || ''}</p>
            </div>
          </div>
          <button 
            onClick={() => { /* sign out logic */ window.location.href = '/'; }}
            className="p-2 text-gray-400 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard value={stats.total} label="Total" color="text-orange-500" />
          <StatCard value={stats.pending} label="New" color="text-yellow-500" />
          <StatCard value={stats.confirmed} label="Active" color="text-blue-500" />
          <StatCard value={`N${(stats.revenue / 1000).toFixed(0)}k`} label="Revenue" color="text-green-500" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 bg-gray-900 rounded-xl p-1">
          {(['new', 'active', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'new' ? 'New Orders' : tab === 'active' ? 'Active' : 'Completed'}
              {tab === 'new' && stats.pending > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.pending}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No {activeTab} orders</p>
            {activeTab === 'new' && (
              <p className="text-gray-600 text-sm mt-1">New orders will appear here when customers buy</p>
            )}
          </div>
        ) : (
          filteredOrders.map(order => {
            const nextAction = getNextAction(order.status);
            return (
              <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {/* Order Header */}
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {order.createdAt?.toDate?.().toLocaleDateString?.() || 'Recent'}
                      </span>
                    </div>
                    <span className="text-orange-400 font-bold">N{order.totalAmount?.toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Package size={14} className="text-orange-500" />
                      {order.items?.map((item, i) => (
                        <span key={i}>{item.quantity}x {item.size} (N{item.price?.toLocaleString()})</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone size={14} className="text-green-500" />
                      {order.buyerPhone || 'No phone'}
                    </div>
                    {order.deliveryType === 'delivery' && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin size={14} className="text-blue-500" />
                        <span className="truncate\">{order.buyerAddress || 'No address'}</span>
                      </div>
                    )}
                    {order.deliveryType === 'pickup' && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin size={14} className="text-purple-500" />
                        Customer will pickup
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {nextAction && (
                  <div className="p-3 bg-gray-800/50 flex gap-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, nextAction.next)}
                      className="flex-1 bg-orange-500 text-black font-bold py-2.5 rounded-xl hover:bg-orange-400 transition flex items-center justify-center gap-2"
                    >
                      <nextAction.icon size={16} />
                      {nextAction.label}
                    </button>
                    {order.buyerPhone && (
                      <a 
                        href={`tel:${order.buyerPhone}`}
                        className="px-4 bg-gray-800 text-green-400 rounded-xl flex items-center justify-center hover:bg-gray-700 transition"
                      >
                        <Phone size={18} />
                      </a>
                    )}
                  </div>
                )}
                
                {order.status === 'completed' && (
                  <div className="p-3 bg-green-900/20 flex items-center justify-center gap-2 text-green-400 text-sm">
                    <Star size={14} fill="currentColor" /> Order Completed
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Links */}
      <div className="px-4 mt-6 space-y-2">
        <Link href="/profile" className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-300 hover:border-orange-500/30 transition">
          <span className="text-sm font-medium\">View Public Profile</span>
          <ChevronRight size={16} className="text-gray-600" />
        </Link>
        <Link href="/buy" className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-300 hover:border-orange-500/30 transition">
          <span className="text-sm font-medium\">Preview Buyer App</span>
          <ChevronRight size={16} className="text-gray-600" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-500\">{label}</p>
    </div>
  );
}
