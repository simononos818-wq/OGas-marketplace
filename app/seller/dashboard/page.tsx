'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Package, TrendingUp, Star, Settings, ToggleLeft, ToggleRight, Eye, Bell, CheckCircle, Clock, Truck, AlertTriangle, Plus, Banknote, Flame, Award, Share2 } from 'lucide-react';
import { sellerVerified, sellerOnline } from '@/lib/fields';
import SellerVerifiedCard from '@/components/SellerVerifiedCard';
import { getSellerBadge } from '@/lib/seller-badges';
import { MIN_PRICE_PER_KG, MAX_PRICE_PER_KG, isValidPricePerKg } from '@/lib/pricing';

const NAVY = '#16305e';
const TEAL = '#12a5b0';
const GREEN = '#0fa958';

interface Order {
  id: string;
  buyerName: string;
  kg: number;
  total: number;
  status: string;
  orderType: string;
  createdAt: any;
  doorCode?: string;
}

interface SellerData {
  businessName: string;
  isOnline: boolean;
  pricePerKg: number;
  deliveryFee: number;
  stock: Record<string, number>;
  rating: number;
  totalOrders: number;
  isApproved?: boolean;
  verified?: boolean;
  isVerified?: boolean;
  status?: string;
}

const CYLINDER_SIZES = ['3kg', '6kg', '12.5kg', '25kg', '50kg'];

export default function SellerDashboard() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'orders' | 'inventory' | 'earnings'>('orders');
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [newDelivery, setNewDelivery] = useState('');
  const [toggling, setToggling] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/seller/login'); return; }
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, 'sellers', user.uid));
        if (snap.exists()) {
          const data = snap.data() as SellerData;
          setSellerData(data);
          setNewPrice(data.pricePerKg?.toString() || '');
          setNewDelivery(data.deliveryFee?.toString() || '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'orders'), where('sellerId', '==', uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(data);
    });
    return () => unsub();
  }, [uid]);

  const toggleOnline = async () => {
    if (!uid || !sellerData) return;
    setToggling(true);
    try {
      const newVal = !sellerOnline(sellerData);
      await updateDoc(doc(db, 'sellers', uid), { isOnline: newVal, updatedAt: serverTimestamp() });
      setSellerData(prev => prev ? { ...prev, isOnline: newVal } : prev);
      showToast(newVal ? '🟢 You are now online!' : '⚫ You are now offline');
    } catch (e) {
      showToast('Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  const savePrice = async () => {
    if (!uid) return;
    const price = parseFloat(newPrice);
    const delivery = parseFloat(newDelivery);
    if (!isValidPricePerKg(price)) { showToast(`Enter a valid price (₦${MIN_PRICE_PER_KG}–₦${MAX_PRICE_PER_KG.toLocaleString()}/kg)`); return; }
    setSavingPrice(true);
    try {
      await updateDoc(doc(db, 'sellers', uid), {
        pricePerKg: price,
        deliveryFee: isNaN(delivery) ? 0 : delivery,
        updatedAt: serverTimestamp(),
      });
      setSellerData(prev => prev ? { ...prev, pricePerKg: price, deliveryFee: isNaN(delivery) ? 0 : delivery } : prev);
      setEditingPrice(false);
      showToast('✅ Prices updated!');
    } catch (e) {
      showToast('Failed to save prices');
    } finally {
      setSavingPrice(false);
    }
  };

  const updateStock = async (size: string, delta: number) => {
    if (!uid || !sellerData) return;
    const current = sellerData.stock?.[size] || 0;
    const newVal = Math.max(0, current + delta);
    try {
      await updateDoc(doc(db, 'sellers', uid), {
        [`stock.${size}`]: newVal,
        updatedAt: serverTimestamp(),
      });
      setSellerData(prev => prev ? { ...prev, stock: { ...prev.stock, [size]: newVal } } : prev);
    } catch (e) {
      showToast('Failed to update stock');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!uid) return;
    // Read-then-check-then-write: guard against double-advancing when two
    // dashboard tabs are open. The seller can only move their own orders
    // (Firestore rules enforce sellerId == auth.uid), and only forward.
    const order = orders.find(o => o.id === orderId);
    if (!order) { showToast('Order not found — refresh and try again.'); return; }
    const FLOW = ['paid_escrow', 'accepted', 'filling', 'out_for_delivery', 'delivered'];
    const expectedNext: Record<string, string> = {
      paid_escrow: 'accepted',
      accepted: 'filling',
      filling: 'out_for_delivery',
      out_for_delivery: 'delivered',
    };
    if (expectedNext[order.status] !== status) {
      showToast(`Cannot move from "${order.status}" to "${status}".`);
      return;
    }
    try {
      const ref = doc(db, 'orders', orderId);
      const snap = await getDoc(ref);
      if (!snap.exists()) { showToast('Order no longer exists.'); return; }
      const live = snap.data();
      if (live.sellerId !== uid) { showToast('Not your order.'); return; }
      if (live.status !== order.status) {
        showToast(`Order already moved to "${live.status}" by another session.`);
        return;
      }
      await updateDoc(ref, { status, updatedAt: serverTimestamp() });
      showToast(`Order marked as ${status.replace(/_/g, ' ')}`);
    } catch (e) {
      showToast('Failed to update order');
    }
  };

  const stats = {
    pending: orders.filter(o => ['paid_escrow', 'pending', 'accepted'].includes(o.status)).length,
    active: orders.filter(o => ['filling', 'out_for_delivery'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0),
  };
  const badge = getSellerBadge(sellerData, stats.delivered);

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: '#f59e0b', paid_escrow: '#8b5cf6', accepted: '#3b82f6',
      filling: '#f97316', out_for_delivery: '#06b6d4', delivered: '#0fa958', cancelled: '#ef4444',
    };
    return map[status] || '#8a8f98';
  };

  const nextStatus = (status: string): string | null => {
    const flow: Record<string, string> = {
      paid_escrow: 'accepted', accepted: 'filling',
      filling: 'out_for_delivery', out_for_delivery: 'delivered',
    };
    return flow[status] || null;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f8' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
    </div>
  );

  if (!sellerData) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: '#f4f6f8' }}>
      <Flame size={48} color={TEAL} className="mb-4" />
      <h2 className="font-bold text-xl" style={{ color: NAVY }}>No Seller Profile</h2>
      <p className="text-sm mt-2 mb-6" style={{ color: '#8a8f98' }}>You need to register as a seller first.</p>
      <Link href="/seller/register" className="px-6 py-3 rounded-xl text-white font-bold" style={{ background: NAVY }}>Register as Seller</Link>
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f6f8', maxWidth: 480, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-white text-[13px] font-bold shadow-lg"
          style={{ background: NAVY, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="px-4 pb-5" style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)`, paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px]" style={{ color: '#8fa6c9' }}>Seller Dashboard</p>
            <h1 className="text-white font-extrabold text-[18px]">{sellerData.businessName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/seller/bank" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(45,212,194,0.15)', border: '1px solid rgba(45,212,194,0.3)' }} title="Bank & payout">
              <Banknote size={16} color="#2dd4c2" />
            </Link>
            <Link href={`/buy/${uid}`} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Eye size={16} color="#fff" />
            </Link>
            <Link href="/seller/settings" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Settings size={16} color="#fff" />
            </Link>
          </div>
        </div>

        {/* Online toggle */}
        <button onClick={toggleOnline} disabled={toggling}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl"
          style={{ background: sellerOnline(sellerData) ? 'rgba(15,169,88,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${sellerOnline(sellerData) ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: sellerOnline(sellerData) ? '#4ade80' : '#6b7280' }} />
            <div className="text-left">
              <p className="text-white font-bold text-[13px]">{sellerOnline(sellerData) ? 'You are Online' : 'You are Offline'}</p>
              <p className="text-[10px]" style={{ color: '#8fa6c9' }}>{sellerOnline(sellerData) ? 'Buyers can see and order from you' : 'You are hidden from buyers'}</p>
            </div>
          </div>
          {sellerOnline(sellerData)
            ? <ToggleRight size={28} color="#4ade80" />
            : <ToggleLeft size={28} color="#6b7280" />
          }
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        {[
          { label: 'Pending Orders', value: stats.pending, icon: Clock, color: '#f59e0b' },
          { label: 'Active Orders', value: stats.active, icon: Truck, color: '#06b6d4' },
          { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: GREEN },
          { label: 'Total Revenue', value: `₦${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: TEAL },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-3.5" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(20,30,50,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold" style={{ color: '#8a8f98' }}>{stat.label}</p>
              <stat.icon size={14} color={stat.color} />
            </div>
            <p className="font-black text-[20px]" style={{ color: NAVY }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Weigh & Fill entry */}
      <div className="px-4 pb-4">
        <Link
          href="/kitchen"
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #16305e, #1e4078)', boxShadow: '0 4px 16px rgba(22,48,94,0.25)' }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(45,212,194,0.15)' }}>
            <span className="text-2xl">⚖️</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-extrabold text-[15px]">Weigh &amp; Fill</p>
            <p className="text-[11px] mt-0.5" style={{ color: '#8fa6c9' }}>Enter Door Code · Record actual kg · Release escrow</p>
          </div>
          <span className="text-[#2dd4c2] text-lg font-bold">→</span>
        </Link>
      </div>

      {badge && uid && (
        <div className="px-4 pb-4">
          <SellerVerifiedCard
            businessName={sellerData.businessName}
            sellerId={uid}
            tier={badge.tier}
            completedOrders={badge.completedOrders}
            nextTier={badge.nextTier}
            ordersToNext={badge.ordersToNext}
          />
        </div>
      )}

      {/* Pricing card */}
      <div className="mx-4 mb-4 rounded-2xl p-4" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(20,30,50,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-[13px]" style={{ color: NAVY }}>Your Pricing</p>
          <button onClick={() => setEditingPrice(!editingPrice)} className="text-[11px] font-bold px-3 py-1 rounded-lg" style={{ background: '#e6f7f8', color: TEAL }}>
            {editingPrice ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editingPrice ? (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold" style={{ color: '#8a8f98' }}>Price per KG (₦)</label>
              <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl text-[16px] font-bold outline-none"
                style={{ background: '#f4f6f8', color: NAVY, border: '1.5px solid #e8ecf0' }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: '#8a8f98' }}>Delivery Fee (₦)</label>
              <input type="number" value={newDelivery} onChange={e => setNewDelivery(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl text-[16px] font-bold outline-none"
                style={{ background: '#f4f6f8', color: NAVY, border: '1.5px solid #e8ecf0' }} />
            </div>
            <button onClick={savePrice} disabled={savingPrice}
              className="w-full py-3 rounded-xl text-white font-bold text-[13px] disabled:opacity-60"
              style={{ background: TEAL }}>
              {savingPrice ? 'Saving…' : 'Save Prices'}
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="flex-1 text-center p-3 rounded-xl" style={{ background: '#f4f6f8' }}>
              <p className="text-[10px]" style={{ color: '#8a8f98' }}>Per KG</p>
              <p className="font-black text-[20px]" style={{ color: NAVY }}>₦{sellerData.pricePerKg.toLocaleString()}</p>
            </div>
            <div className="flex-1 text-center p-3 rounded-xl" style={{ background: '#f4f6f8' }}>
              <p className="text-[10px]" style={{ color: '#8a8f98' }}>Delivery</p>
              <p className="font-black text-[20px]" style={{ color: NAVY }}>₦{sellerData.deliveryFee.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mb-4 rounded-xl overflow-hidden" style={{ background: '#e8ecf0' }}>
        {(['orders', 'inventory', 'earnings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-[12px] font-bold capitalize transition-all"
            style={{ background: tab === t ? '#fff' : 'transparent', color: tab === t ? NAVY : '#8a8f98', borderRadius: 10, margin: 2, boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4">
        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={40} color="#c8cdd4" className="mx-auto mb-3" />
                <p className="font-bold" style={{ color: '#8a8f98' }}>No orders yet</p>
                <p className="text-[12px] mt-1" style={{ color: '#c8cdd4' }}>Orders from buyers will appear here</p>
              </div>
            ) : orders.map(order => {
              const next = nextStatus(order.status);
              return (
                <div key={order.id} className="rounded-2xl p-4" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(20,30,50,0.06)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-[13px]" style={{ color: NAVY }}>{order.buyerName || 'Buyer'}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#8a8f98' }}>
                        {order.kg}kg · {order.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[15px]" style={{ color: NAVY }}>₦{order.total.toLocaleString()}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${statusColor(order.status)}18`, color: statusColor(order.status) }}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  {order.status === 'paid_escrow' && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl mb-2" style={{ background: '#f5f3ff' }}>
                      <ShieldCheck size={13} color="#8b5cf6" />
                      <p className="text-[11px] font-semibold" style={{ color: '#7c3aed' }}>Payment secured in escrow</p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Link href={`/seller/orders/${order.id}`} className="flex-1 py-2 rounded-xl text-center text-[11px] font-bold"
                      style={{ background: '#f4f6f8', color: NAVY }}>
                      View Details
                    </Link>
                    {next && (
                      <button onClick={() => updateOrderStatus(order.id, next)}
                        className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white"
                        style={{ background: TEAL }}>
                        Mark {next.replace(/_/g, ' ')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* INVENTORY TAB */}
        {tab === 'inventory' && (
          <div className="space-y-3">
            <p className="text-[12px] font-semibold" style={{ color: '#8a8f98' }}>Update cylinder stock levels</p>
            {CYLINDER_SIZES.map(size => {
              const count = sellerData.stock?.[size] || 0;
              return (
                <div key={size} className="flex items-center justify-between p-4 rounded-2xl"
                  style={{ background: '#fff', boxShadow: '0 2px 8px rgba(20,30,50,0.06)' }}>
                  <div>
                    <p className="font-bold text-[14px]" style={{ color: NAVY }}>{size} Cylinder</p>
                    <p className="text-[11px] mt-0.5" style={{ color: count === 0 ? '#ef4444' : count < 5 ? '#f59e0b' : GREEN }}>
                      {count === 0 ? 'Out of stock' : count < 5 ? `Low stock · ${count} left` : `${count} in stock`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateStock(size, -1)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
                      style={{ background: '#f4f6f8', color: NAVY }}>−</button>
                    <span className="font-black text-[20px] w-8 text-center" style={{ color: NAVY }}>{count}</span>
                    <button onClick={() => updateStock(size, 1)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: '#e6f7f8' }}>
                      <Plus size={16} color={TEAL} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* EARNINGS TAB */}
        {tab === 'earnings' && (
          <div className="space-y-4">
            {/* Escrow status */}
            <Link href="/seller/earnings" className="block rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(20,30,50,0.06)' }}>
              <div className="p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0a2540, #16305e)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(45,212,194,0.15)' }}>
                    <Banknote size={18} color="#2dd4c2" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-[13px]">Earnings &amp; Escrow</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#8fa6c9' }}>Track payouts, escrow holds &amp; history</p>
                  </div>
                </div>
                <span className="text-[#2dd4c2] font-bold text-lg">→</span>
              </div>
            </Link>
            <div className="rounded-2xl p-5 text-center" style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)` }}>
              <p className="text-[12px]" style={{ color: '#8fa6c9' }}>Total Revenue (Delivered)</p>
              <p className="font-black text-[36px] text-white mt-1">₦{stats.revenue.toLocaleString()}</p>
              <p className="text-[11px] mt-1" style={{ color: '#2dd4c2' }}>{stats.delivered} orders completed</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(20,30,50,0.06)' }}>
              <p className="font-bold text-[13px] mb-3" style={{ color: NAVY }}>Recent Transactions</p>
              {orders.filter(o => o.status === 'delivered').slice(0, 10).map(order => (
                <div key={order.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #f4f6f8' }}>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: NAVY }}>{order.buyerName || 'Buyer'}</p>
                    <p className="text-[10px]" style={{ color: '#8a8f98' }}>{order.kg}kg · Delivered</p>
                  </div>
                  <p className="font-bold text-[13px]" style={{ color: GREEN }}>+₦{order.total.toLocaleString()}</p>
                </div>
              ))}
              {stats.delivered === 0 && (
                <p className="text-center text-[12px] py-4" style={{ color: '#8a8f98' }}>No completed orders yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShieldCheck({ size, color, className }: { size: number; color: string; className?: string }) {
  return <CheckCircle size={size} color={color} className={className} />;
}
