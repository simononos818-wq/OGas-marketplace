'use client';

import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Flame, Package, MapPin, Clock, CheckCircle, Truck, Star, LogOut, ChevronRight, RefreshCw, Banknote, KeyRound, MessageSquare } from 'lucide-react';
import ChatButton from '@/components/ChatButton';
import { authHeaders } from '@/lib/client-auth';
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
  const [doorInputs, setDoorInputs] = useState<Record<string, string>>({});
  const [unlocking, setUnlocking] = useState<string | null>(null);
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
        
        if (order.status === 'paid' || order.status === 'pending_payment' || order.status === 'pending_cash') pendingCount++;
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
      const headers = await authHeaders();
      const res = await fetch('/api/order-status', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (err: any) {
      console.error('Failed to update order:', err);
      alert(err.message || 'Failed to update order. Try again.');
    }
  };

  const unlockEscrow = async (orderId: string) => {
    const code = doorInputs[orderId];
    if (!code) {
      alert('Ask the buyer for the Door Code at the door.');
      return;
    }
    setUnlocking(orderId);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/release-escrow', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId, action: 'seller_code', doorCode: code }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      alert('Door Code matched. Escrow is released to you.');
    } catch (err: any) {
      alert(err.message || 'Could not unlock escrow');
    } finally {
      setUnlocking(null);
    }
  };

  const completeCash = async (orderId: string) => {
    setUnlocking(orderId);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/release-escrow', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId, action: 'cash' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (err: any) {
      alert(err.message || 'Could not complete cash order');
    } finally {
      setUnlocking(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'new') return order.status === 'pending_payment' || order.status === 'paid' || order.status === 'pending' || order.status === 'pending_cash';
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
      case 'pending_cash': return 'Cash — confirm when paid';
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
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-900/30 to-black px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/ogas-logo.svg" alt="OGas" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold">{sellerData?.businessName || 'My Store'}</h1>
              <p className="text-xs text-gray-400">{sellerData?.address || ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/chat" className="p-2 text-orange-400 hover:text-orange-300" aria-label="Messages">
              <MessageSquare size={18} />
            </Link>
            <button 
              onClick={() => { window.location.href = '/'; }}
              className="p-2 text-gray-400 hover:text-white"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard value={stats.total} label="Total" color="text-orange-500" />
          <StatCard value={stats.pending} label="New" color="text-yellow-500" />
          <StatCard value={stats.confirmed} label="Active" color="text-blue-500" />
          <StatCard value={`N${(stats.revenue / 1000).toFixed(0)}k`} label="Revenue" color="text-green-500" />
        </div>
      </div>


      {/* Payout */}
      <div className="px-4 mt-3">
        <Link href="/seller/bank" className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition">
          <Banknote size={16} />
          Set Payout Account
        </Link>
      </div>      {/* Tabs */}
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
                    {order.deliveryType === 'delivery' && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin size={14} className="text-blue-500" />
                        <span className="truncate">{order.buyerAddress || 'No address'}</span>
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

                <div className="px-3 pt-3">
                  <ChatButton orderId={order.id} label="Message buyer" />
                </div>

                {/* Action Buttons */}
                {order.status === 'pending_cash' && (
                  <div className="p-3 bg-black/40 space-y-2">
                    <p className="text-xs text-gray-400">Cash order. Confirm only after you have the money in hand.</p>
                    <button
                      onClick={() => completeCash(order.id)}
                      disabled={unlocking === order.id}
                      className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm"
                    >
                      {unlocking === order.id ? 'Saving…' : 'Customer paid cash'}
                    </button>
                  </div>
                )}

                {['paid', 'confirmed', 'out_for_delivery', 'delivered'].includes(order.status) && (
                  <div className="p-3 bg-black/40 space-y-2">
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <KeyRound size={12} /> Ask the buyer for the Door Code. That is how you get paid.
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={doorInputs[order.id] || ''}
                        onChange={(e) => setDoorInputs({ ...doorInputs, [order.id]: e.target.value.toUpperCase() })}
                        placeholder="Door Code"
                        className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-sm tracking-[0.25em] uppercase"
                      />
                      <button
                        onClick={() => unlockEscrow(order.id)}
                        disabled={unlocking === order.id}
                        className="px-4 bg-green-600 text-white font-bold rounded-xl text-sm"
                      >
                        {unlocking === order.id ? '...' : 'Unlock'}
                      </button>
                    </div>
                  </div>
                )}

                {nextAction && (
                  <div className="p-3 bg-gray-800/50 flex gap-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, nextAction.next)}
                      className="flex-1 bg-orange-500 text-black font-bold py-2.5 rounded-xl hover:bg-orange-400 transition flex items-center justify-center gap-2"
                    >
                      <nextAction.icon size={16} />
                      {nextAction.label}
                    </button>
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
          <span className="text-sm font-medium">View Public Profile</span>
          <ChevronRight size={16} className="text-gray-600" />
        </Link>
        <Link href="/buy" className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-300 hover:border-orange-500/30 transition">
          <span className="text-sm font-medium">Preview Buyer App</span>
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
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}
