'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';

interface Order {
  id: string;
  sellerName: string;
  items: { size: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  deliveryFee: number;
  status: string;
  paymentMethod: string;
  paymentReference?: string;
  createdAt: any;
}

function OrdersContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'orders'),
      where('buyerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500';
      case 'pending_payment': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'pending_cash': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'delivered': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return '✅ Paid';
      case 'pending_payment': return '⏳ Awaiting Payment';
      case 'pending_cash': return '💵 Cash on Delivery';
      case 'delivered': return '📦 Delivered';
      default: return status;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please sign in to view your orders</p>
          <Link href="/" className="text-orange-500 hover:underline">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-2">My Orders</h1>
        <p className="text-gray-400 text-sm mb-6">Track your gas deliveries</p>

        {success && (
          <div className="bg-green-500/20 border border-green-500 rounded-2xl p-4 mb-6 text-center">
            <div className="text-green-400 font-bold text-lg mb-1">🎉 Payment Successful!</div>
            <p className="text-green-300 text-sm">Your order has been placed. The seller will contact you soon.</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400 mb-4">No orders yet</p>
            <Link href="/buy" className="inline-block px-6 py-3 bg-orange-500 text-black font-bold rounded-xl">
              Order Gas Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{order.sellerName}</h3>
                    <p className="text-gray-400 text-xs">#{order.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                <div className="space-y-1 mb-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.size} x{item.quantity}</span>
                      <span>₦{(item.unitPrice * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Delivery</span>
                    <span>₦{order.deliveryFee?.toLocaleString() || 0}</span>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total</span>
                  <span className="font-bold text-xl text-orange-500">₦{order.totalAmount?.toLocaleString()}</span>
                </div>

                {order.paymentReference && (
                  <p className="text-xs text-gray-500 mt-2">Ref: {order.paymentReference}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white p-4 flex items-center justify-center">Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
