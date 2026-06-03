'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  collection, query, where, getDocs, doc, getDoc, updateDoc, 
  onSnapshot, orderBy, Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Order {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  gasSize: string;
  quantity: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: Timestamp;
}

interface SellerProfile {
  id: string;
  businessName: string;
  phone: string;
  address: string;
  isAvailable: boolean;
  totalOrders: number;
  totalEarnings: number;
}

export default function SellerDashboardContent() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get('id') || 'demo-seller';
  
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'earnings'>('orders');
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    loadSellerData();
    const unsub = subscribeToOrders();
    return () => unsub();
  }, [sellerId]);

  const loadSellerData = async () => {
    try {
      const ref = doc(db, 'vendors', sellerId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as SellerProfile;
        setProfile({ ...data, id: snap.id });
        setIsAvailable(data.isAvailable !== false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrders = () => {
    const q = query(
      collection(db, 'orders'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setOrders(data);
      
      const earnings = data
        .filter(o => o.paymentStatus === 'paid' || o.paymentMethod === 'cash')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      if (profile) {
        setProfile(prev => prev ? { ...prev, totalOrders: data.length, totalEarnings: earnings } : null);
      }
    });
  };

  const toggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      await updateDoc(doc(db, 'vendors', sellerId), { isAvailable: newStatus });
      setIsAvailable(newStatus);
    } catch (e) {
      console.error(e);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'confirmed': return 'text-blue-400';
      case 'out_for_delivery': return 'text-purple-400';
      case 'delivered': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'pending_payment');
  const todayOrders = orders.filter(o => {
    const orderDate = o.createdAt?.toDate();
    const today = new Date();
    return orderDate && orderDate.toDateString() === today.toDateString();
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/95 border-b border-gray-800 backdrop-blur">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg">Seller Dashboard</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{isAvailable ? '🟢 Online' : '🔴 Offline'}</span>
            <button
              onClick={toggleAvailability}
              className={`w-12 h-6 rounded-full transition-colors ${isAvailable ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-md mx-auto px-4 py-4 grid grid-cols-3 gap-3">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-400">{todayOrders.length}</p>
          <p className="text-xs text-gray-400">Today</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-400">{pendingOrders.length}</p>
          <p className="text-xs text-gray-400">Pending</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">₦{(profile?.totalEarnings || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">Earnings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-4 flex gap-2 mb-4">
        {(['orders', 'profile', 'earnings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm capitalize transition-colors ${
              activeTab === tab ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-md mx-auto px-4 pb-8">
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No orders yet.</p>
                <p className="text-sm text-gray-500 mt-2">Orders will appear here when buyers place them.</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold">{order.buyerName}</p>
                      <p className="text-sm text-gray-400">📞 {order.buyerPhone}</p>
                      <p className="text-sm text-gray-400">📍 {order.buyerAddress}</p>
                    </div>
                    <span className={`text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">{order.quantity}x {order.gasSize}kg</span>
                    <span className="font-bold">₦{order.totalAmount?.toLocaleString()}</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold"
                      >
                        Mark Out for Delivery
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4">
            <div>
              <label className="text-sm text-gray-400">Business Name</label>
              <p className="font-bold text-lg">{profile?.businessName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Phone</label>
              <p className="font-bold">{profile?.phone}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Address</label>
              <p className="font-bold">{profile?.address}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Availability</label>
              <button
                onClick={toggleAvailability}
                className={`mt-2 w-full py-3 rounded-xl font-bold transition-colors ${
                  isAvailable ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                {isAvailable ? '🟢 Currently Accepting Orders' : '🔴 Temporarily Closed'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-3">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-sm text-gray-400">Total Earnings</p>
              <p className="text-3xl font-bold text-green-400">₦{(profile?.totalEarnings || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-sm text-gray-400">Total Orders</p>
              <p className="text-3xl font-bold text-orange-400">{profile?.totalOrders || 0}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-sm text-gray-400">Completed Deliveries</p>
              <p className="text-3xl font-bold text-blue-400">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
