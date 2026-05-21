'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc,
  onSnapshot, orderBy, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Phone, MapPin, Package, DollarSign, Star, CheckCircle, XCircle, Truck, User } from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const sellerId = searchParams.get('sellerId') || 'seller_simon_001';

  useEffect(() => {
    if (!sellerId) return;
    
    // Fetch seller profile
    const unsubProfile = onSnapshot(doc(db, 'sellers', sellerId), (snap) => {
      if (snap.exists()) setProfile(snap.data());
    });

    // Fetch orders
    const q = query(
      collection(db, 'orders'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubOrders = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(data);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubOrders();
    };
  }, [sellerId]);

  const updateStatus = async (orderId: string, status: string) => {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: Timestamp.now()
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-800 rounded-xl" />
          <div className="h-32 bg-gray-800 rounded-xl" />
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black">OGas Seller</h1>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${profile?.isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm">{profile?.isAvailable ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
          <h2 className="text-lg font-bold">{profile?.businessName || 'Your Business'}</h2>
          <p className="text-sm text-white/70">{profile?.ownerName}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" />
              {profile?.rating || 5.0}
            </span>
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {profile?.totalOrders || 0} orders
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              ₦{(profile?.totalEarnings || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-4">
        <div className="bg-gray-800 rounded-xl p-1 flex">
          {['orders', 'earnings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize ${
                activeTab === tab ? 'bg-orange-500 text-white' : 'text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No orders yet</p>
                <p className="text-sm text-gray-500 mt-1">Orders will appear here when customers buy</p>
              </div>
            )}
            
            {orders.map(order => (
              <div key={order.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">#{order.id.slice(-6)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    order.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                    order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-300 mb-3">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {order.buyerName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {order.buyerPhone}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {order.location?.address || 'No address'}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    {order.items?.map((item: any, i: number) => (
                      <p key={i} className="text-sm text-gray-400">
                        {item.quantity}x {item.size}kg @ ₦{item.pricePerUnit?.toLocaleString()}
                      </p>
                    ))}
                  </div>
                  <p className="text-lg font-bold text-orange-400">₦{order.totalAmount?.toLocaleString()}</p>
                </div>

                {order.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(order.id, 'accepted')}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'rejected')}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}

                {order.status === 'accepted' && (
                  <button
                    onClick={() => updateStatus(order.id, 'delivered')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Truck className="w-4 h-4" />
                    Mark Delivered
                  </button>
                )}
              </div>
            ))}
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

export default function SellerDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
