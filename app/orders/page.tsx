'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { authHeaders } from '@/lib/client-auth';
import Link from 'next/link';
import { CheckCircle, Loader2, KeyRound } from 'lucide-react';
import ChatButton from '@/components/ChatButton';

interface Order {
  id: string;
  sellerName: string;
  sellerPhone?: string;
  items: { size: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  deliveryFee: number;
  status: string;
  paymentMethod: string;
  paymentReference?: string;
  createdAt: any;
  gasSize?: string;
  quantity?: number;
  pricePerKg?: number;
  total?: number;
  totalPrice?: number;
  paystackRef?: string;
  paystackReference?: string;
}

function OrdersContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const refParam = searchParams.get('ref');
  const statusParam = searchParams.get('status');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [doorCodes, setDoorCodes] = useState<Record<string, string>>({});
  const [callbackState, setCallbackState] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [callbackMessage, setCallbackMessage] = useState('');

  // Handle Paystack callback: verify then confirm via API
  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (reference && callbackState === 'idle') {
      setCallbackState('verifying');
      setCallbackMessage('Confirming your payment...');

      fetch('/api/verify-payment', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          reference,
          orderId: searchParams.get('ref') || searchParams.get('orderId') || undefined,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCallbackState('success');
            setCallbackMessage('Payment successful! Your order has been placed.');
          } else {
            setCallbackState('error');
            setCallbackMessage(data.message || 'We could not confirm this payment. Contact support if you were charged.');
          }
        })
        .catch(() => {
          setCallbackState('error');
          setCallbackMessage('Network error confirming payment. Contact support if you were charged.');
        });
    }
  }, [searchParams, callbackState]);

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

  useEffect(() => {
    if (!user || orders.length === 0) return;
    let cancelled = false;
    (async () => {
      const headers = await authHeaders();
      const next: Record<string, string> = {};
      for (const order of orders) {
        const held = order.status === 'paid' || order.status === 'confirmed' || order.status === 'out_for_delivery' || order.status === 'delivered';
        if (!held) continue;
        try {
          const cached = sessionStorage.getItem(`ogas-door-${order.id}`);
          if (cached) {
            next[order.id] = cached;
            continue;
          }
        } catch {
          /* ignore */
        }
        const res = await fetch(`/api/door-code?orderId=${order.id}`, { headers });
        const data = await res.json();
        if (data.doorCode) next[order.id] = data.doorCode;
      }
      if (!cancelled) setDoorCodes(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, orders]);

  const confirmDelivery = async (orderId: string) => {
    if (!confirm('Have you received your gas? This releases escrow to the seller.')) return;
    setConfirming(orderId);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/release-escrow', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId, action: 'buyer_confirm' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      alert('Delivery confirmed. Escrow released to the seller.');
    } catch (e: any) {
      alert(e.message || 'Error confirming delivery. Please try again.');
    } finally {
      setConfirming(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500';
      case 'pending_payment': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'pending_cash': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'out_for_delivery': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'delivered':
      case 'completed': return 'bg-purple-500/20 text-purple-400 border-purple-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return '✅ Paid - Preparing';
      case 'pending_payment': return '⏳ Awaiting Payment';
      case 'pending_cash': return '💵 Cash on Delivery';
      case 'out_for_delivery': return '🚚 Out for Delivery';
      case 'delivered': return '✅ Delivered';
      case 'completed': return '✅ Completed';
      default: return status;
    }
  };

  const normalizeOrder = (order: Order) => {
    const items = order.items?.length ? order.items : [];
    if (items.length === 0 && order.gasSize) {
      items.push({
        size: order.gasSize,
        quantity: order.quantity || 1,
        unitPrice: order.pricePerKg || 0,
      });
    }
    return {
      ...order,
      items,
      totalAmount: order.totalAmount || order.total || order.totalPrice || 0,
      paymentReference: order.paymentReference || order.paystackRef || order.paystackReference || '',
    };
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

        {success && callbackState === 'idle' && (
          <div className="bg-green-500/20 border border-green-500 rounded-2xl p-4 mb-6 text-center">
            <div className="text-green-400 font-bold text-lg mb-1">🎉 Order Placed!</div>
            <p className="text-green-300 text-sm">Your order is in. Chat with the store in Messages — numbers stay private.</p>
          </div>
        )}

        {callbackState === 'verifying' && (
          <div className="bg-blue-500/20 border border-blue-500 rounded-2xl p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-400 font-bold text-lg mb-1">
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying Payment
            </div>
            <p className="text-blue-300 text-sm">{callbackMessage}</p>
          </div>
        )}

        {callbackState === 'success' && (
          <div className="bg-green-500/20 border border-green-500 rounded-2xl p-4 mb-6 text-center">
            <div className="text-green-400 font-bold text-lg mb-1">🎉 {callbackMessage}</div>
            <p className="text-green-300 text-sm">Open Messages to talk to the store. Share the Door Code only at the door.</p>
          </div>
        )}

        {callbackState === 'error' && (
          <div className="bg-red-500/20 border border-red-500 rounded-2xl p-4 mb-6 text-center">
            <div className="text-red-400 font-bold text-lg mb-1">⚠️ Payment Issue</div>
            <p className="text-red-300 text-sm">{callbackMessage}</p>
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
            {orders.map((order) => {
              const o = normalizeOrder(order);
              return (
                <div key={order.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{o.sellerName || 'Unknown Seller'}</h3>
                      <p className="text-gray-400 text-xs">#{order.id.slice(-6).toUpperCase()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    {o.items.map((item, i) => (
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

                  <div className="border-t border-gray-800 pt-3 flex justify-between items-center mb-3">
                    <span className="text-gray-400 text-sm">Total</span>
                    <span className="font-bold text-xl text-orange-500">₦{o.totalAmount.toLocaleString()}</span>
                  </div>

                  {doorCodes[order.id] && (
                    <div className="mb-3 rounded-xl border border-orange-500/40 bg-orange-500/10 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-orange-300 flex items-center justify-center gap-1">
                        <KeyRound size={12} /> Door Code — say this at the door
                      </p>
                      <p className="mt-1 font-mono text-2xl tracking-[0.3em] text-orange-400">{doorCodes[order.id]}</p>
                    </div>
                  )}

                  <ChatButton orderId={order.id} label="Message store" />

                  {(order.status === 'out_for_delivery' || order.status === 'delivered' || order.status === 'paid' || order.status === 'confirmed') && (
                    <button
                      onClick={() => confirmDelivery(order.id)}
                      disabled={confirming === order.id}
                      className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition mt-2"
                    >
                      <CheckCircle size={18} />
                      {confirming === order.id ? 'Releasing escrow...' : 'I have my gas — release escrow'}
                    </button>
                  )}

                  {o.paymentReference && (
                    <p className="text-xs text-gray-500 mt-2">Ref: {o.paymentReference}</p>
                  )}
                </div>
              );
            })}
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
