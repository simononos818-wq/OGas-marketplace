'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

interface Order {
  id: string;
  sellerId: string;
  orderDetails: { size: string; quantity: number };
  payment: { amount: number; status: string; method: string };
  status: string;
  createdAt: any;
  buyerInfo: { name: string; phone: string; address: string };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneFilter, setPhoneFilter] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach(doc => list.push({ ...doc.data() as Order, id: doc.id }));
      setOrders(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      pending: '🕐', confirmed: '✅', out_for_delivery: '🚚',
      delivered: '🎉', cancelled: '❌',
    };
    return icons[status] || '⏳';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-400', confirmed: 'text-blue-400',
      out_for_delivery: 'text-purple-400', delivered: 'text-green-400', cancelled: 'text-red-400',
    };
    return colors[status] || 'text-gray-400';
  };

  const filteredOrders = phoneFilter 
    ? orders.filter(o => o.buyerInfo?.phone?.includes(phoneFilter))
    : orders;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-orange-100 text-sm">Track your gas deliveries</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <input
          type="tel"
          placeholder="Enter phone to find your orders"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 mb-4"
          value={phoneFilter}
          onChange={e => setPhoneFilter(e.target.value)}
        />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📦</span>
            </div>
            <p className="text-gray-400 mb-2">No orders found</p>
            <p className="text-sm text-gray-500">
              {phoneFilter ? 'Try a different phone number' : 'Place your first order'}
            </p>
            <a href="/buy/" className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl">
              Order Gas Now
            </a>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold">Order #{order.id.slice(-6)}</p>
                  <p className="text-sm text-gray-400">
                    {order.createdAt?.toDate?.().toLocaleDateString?.('en-NG') || 'Recent'}
                  </p>
                </div>
                <div className={`text-2xl ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-3 mb-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Gas</span>
                  <span>{order.orderDetails?.size} x {order.orderDetails?.quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-orange-400 font-bold">₦{order.payment?.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Payment</span>
                  <span className="capitalize">{order.payment?.method?.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full bg-gray-700 ${getStatusColor(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                {order.status === 'out_for_delivery' && (
                  <span className="text-xs text-green-400">🚚 On the way!</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
