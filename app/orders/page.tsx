'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { authHeaders } from '@/lib/client-auth';
import Link from 'next/link';
import { CheckCircle, Loader2, KeyRound, Package } from 'lucide-react';
import ChatButton from '@/components/ChatButton';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

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
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [doorCodes, setDoorCodes] = useState<Record<string, string>>({});
  const [callbackState, setCallbackState] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [callbackMessage, setCallbackMessage] = useState('');

  // Handle Paystack callback: verify then confirm via API
  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    const orderId = searchParams.get('ref') || searchParams.get('orderId') || undefined;
    if (!reference || callbackState !== 'idle' || !user) return;

    let cancelled = false;
    setCallbackState('verifying');
    setCallbackMessage('Confirming your payment...');

    (async () => {
      try {
        const headers = await authHeaders();
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers,
          body: JSON.stringify({ reference, orderId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          setCallbackState('success');
          setCallbackMessage('Payment locked in escrow. Share the Door Code only at the door.');
        } else {
          setCallbackState('error');
          setCallbackMessage(data.message || 'We could not confirm this payment. Contact support if you were charged.');
        }
      } catch {
        if (!cancelled) {
          setCallbackState('error');
          setCallbackMessage('Network error confirming payment. Contact support if you were charged.');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [searchParams, callbackState, user]);

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

  const statusStyle = (status: string): { bg: string; color: string; border: string } => {
    switch (status) {
      case 'paid': return { bg: '#e7f9ee', color: '#0fa958', border: '#b7e8cd' };
      case 'pending_payment': return { bg: '#fff4e0', color: '#b35400', border: '#f0d48a' };
      case 'pending_cash': return { bg: '#e6f7f8', color: TEAL, border: '#bfe6e9' };
      case 'out_for_delivery': return { bg: '#e8eefc', color: NAVY, border: '#c4d2ee' };
      case 'delivered':
      case 'completed': return { bg: '#e7f9ee', color: '#0fa958', border: '#b7e8cd' };
      default: return { bg: '#f0f2f5', color: '#8a8f98', border: '#e6e9ee' };
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
      <div className="min-h-screen p-4 flex items-center justify-center" style={{ background: '#f4f6f8' }}>
        <div className="text-center">
          <p className="mb-4 text-sm font-bold" style={{ color: '#8a8f98' }}>Please sign in to view your orders</p>
          <Link href="/login" className="font-bold" style={{ color: TEAL }}>Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24" style={{ background: '#f4f6f8' }}>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: NAVY }}>My Orders</h1>
        <p className="text-sm mb-6" style={{ color: '#8a8f98' }}>Track your gas deliveries</p>

        {success && callbackState === 'idle' && (
          <div className="border rounded-2xl p-4 mb-6 text-center" style={{ background: '#e7f9ee', borderColor: '#b7e8cd' }}>
            <div className="font-bold text-lg mb-1" style={{ color: '#0fa958' }}>🎉 Order Placed!</div>
            <p className="text-sm" style={{ color: '#0a7a42' }}>Your order is in. Chat with the store in Messages — numbers stay private.</p>
          </div>
        )}

        {callbackState === 'verifying' && (
          <div className="border rounded-2xl p-4 mb-6 text-center" style={{ background: '#e8eefc', borderColor: '#c4d2ee' }}>
            <div className="flex items-center justify-center gap-2 font-bold text-lg mb-1" style={{ color: NAVY }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying Payment
            </div>
            <p className="text-sm" style={{ color: NAVY }}>{callbackMessage}</p>
          </div>
        )}

        {callbackState === 'success' && (
          <div className="border rounded-2xl p-4 mb-6 text-center" style={{ background: '#e7f9ee', borderColor: '#b7e8cd' }}>
            <div className="font-bold text-lg mb-1" style={{ color: '#0fa958' }}>🎉 {callbackMessage}</div>
            <p className="text-sm" style={{ color: '#0a7a42' }}>Open Messages to talk to the store. Share the Door Code only at the door.</p>
          </div>
        )}

        {callbackState === 'error' && (
          <div className="border rounded-2xl p-4 mb-6 text-center" style={{ background: '#fdeceb', borderColor: '#f5b3ae' }}>
            <div className="font-bold text-lg mb-1" style={{ color: '#e74c3c' }}>⚠️ Payment Issue</div>
            <p className="text-sm" style={{ color: '#c0392b' }}>{callbackMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-sm" style={{ color: '#8a8f98' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📭</div>
            <p className="mb-4 text-sm" style={{ color: '#8a8f98' }}>No orders yet</p>
            <Link href="/" className="inline-block px-6 py-3 text-white font-bold rounded-xl" style={{ background: TEAL }}>
              Order Gas Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const o = normalizeOrder(order);
              const st = statusStyle(order.status);
              return (
                <div key={order.id} className="rounded-2xl p-4 bg-white" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: '#1a1d23' }}>{o.sellerName || 'Unknown Seller'}</h3>
                      <p className="text-xs" style={{ color: '#8a8f98' }}>#{order.id.slice(-6).toUpperCase()}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold border" style={{ background: st.bg, color: st.color, borderColor: st.border }}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    {o.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span style={{ color: '#8a8f98' }}>{item.size} x{item.quantity}</span>
                        <span style={{ color: '#1a1d23' }}>₦{(item.unitPrice * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#8a8f98' }}>Delivery</span>
                      <span style={{ color: '#1a1d23' }}>₦{order.deliveryFee?.toLocaleString() || 0}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 flex justify-between items-center mb-3" style={{ borderColor: '#f0f2f5' }}>
                    <span className="text-sm" style={{ color: '#8a8f98' }}>Total</span>
                    <span className="font-bold text-xl" style={{ color: NAVY }}>₦{o.totalAmount.toLocaleString()}</span>
                  </div>

                  {doorCodes[order.id] && (
                    <div className="mb-3 rounded-xl border p-3 text-center" style={{ background: '#e6f7f8', borderColor: '#bfe6e9' }}>
                      <p className="text-[10px] uppercase tracking-wide flex items-center justify-center gap-1" style={{ color: TEAL }}>
                        <KeyRound size={12} /> Door Code — say this at the door
                      </p>
                      <p className="mt-1 font-mono text-2xl tracking-[0.3em]" style={{ color: NAVY }}>{doorCodes[order.id]}</p>
                    </div>
                  )}

                  <ChatButton orderId={order.id} label="Message store" />

                  {(order.status === 'out_for_delivery' || order.status === 'delivered' || order.status === 'paid' || order.status === 'confirmed') && (
                    <button
                      onClick={() => confirmDelivery(order.id)}
                      disabled={confirming === order.id}
                      className="w-full py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition mt-2"
                      style={{ background: '#0fa958' }}
                    >
                      <CheckCircle size={18} />
                      {confirming === order.id ? 'Releasing escrow...' : 'I have my gas — release escrow'}
                    </button>
                  )}

                  {o.paymentReference && (
                    <p className="text-xs mt-2" style={{ color: '#8a8f98' }}>Ref: {o.paymentReference}</p>
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
    <Suspense fallback={<div className="min-h-screen p-4 flex items-center justify-center" style={{ background: '#f4f6f8' }}><Loader2 className="animate-spin" style={{ color: TEAL }} /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
