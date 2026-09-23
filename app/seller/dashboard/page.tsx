'use client';

import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Flame, Package, MapPin, CheckCircle, Truck, Star, LogOut, Banknote, KeyRound, MessageSquare, Power, Save, Minus, Plus } from 'lucide-react';
import ChatButton from '@/components/ChatButton';
import WalkInSaleButton from '@/components/WalkInSaleButton';
import { authHeaders } from '@/lib/client-auth';
import Link from 'next/link';

const NAVY = '#16305e', TEAL = '#12a5b0';

interface Order {
  id: string;
  buyerPhone: string;
  buyerAddress: string;
  items: { size: string; quantity: number; price: number }[];
  totalAmount: number;
  deliveryType: string;
  status: string;
  paymentStatus: string;
  paystackRef: string;
  createdAt: any;
}

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [isSeller, setIsSeller] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sellerData, setSellerData] = useState<any>(null);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    getDoc(doc(db, 'sellers', user.uid)).then((snap) => {
      setIsSeller(snap.exists());
      if (snap.exists()) setSellerData(snap.data());
      setChecking(false);
    });
  }, [user]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f8' }}>
        <div className="animate-pulse font-bold text-sm" style={{ color: NAVY }}>Loading your store…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f4f6f8' }}>
        <div className="text-center">
          <p className="text-lg font-extrabold mb-4" style={{ color: NAVY }}>Seller sign in</p>
          <a href="/seller/login" className="inline-block text-white font-bold px-8 py-3 rounded-xl" style={{ background: TEAL }}>Sign In</a>
        </div>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f4f6f8' }}>
        <div className="text-center">
          <p className="text-lg font-extrabold mb-1" style={{ color: NAVY }}>No store on this number</p>
          <p className="text-sm mb-4" style={{ color: '#8a8f98' }}>Register your gas shop to start selling.</p>
          <a href="/seller/register" className="inline-block text-white font-bold px-8 py-3 rounded-xl" style={{ background: TEAL }}>Register store</a>
        </div>
      </div>
    );
  }

  return <SellerStudio userId={user.uid} sellerData={sellerData} />;
}

/* ==================================================================
   SELLER STUDIO — inventory control + orders
   ================================================================== */
function SellerStudio({ userId, sellerData }: { userId: string; sellerData: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, delivered: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'active' | 'completed'>('new');
  const [doorInputs, setDoorInputs] = useState<Record<string, string>>({});

  /* --- inventory state (editable) --- */
  const [isOpen, setIsOpen] = useState(sellerData?.isActive !== false);
  const [price, setPrice] = useState<string>(String(sellerData?.pricePerKg || ''));
  const [stock, setStock] = useState<number>(sellerData?.kgInStock ?? 50);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const refreshStore = async () => {
    const snap = await getDoc(doc(db, 'sellers', userId));
    if (snap.exists()) {
      const d = snap.data();
      setIsOpen(d.isActive !== false);
      if (d.pricePerKg) setPrice(String(d.pricePerKg));
      if (typeof d.kgInStock === 'number') setStock(d.kgInStock);
    }
  };

  /* live open/closed toggle — instant marketplace visibility */
  const toggleOpen = async () => {
    const next = !isOpen;
    setIsOpen(next);
    await updateDoc(doc(db, 'sellers', userId), { isActive: next, updatedAt: new Date().toISOString() });
  };

  const saveInventory = async () => {
    const p = Number(price);
    if (!p || p < 800 || p > 2500) { alert('Enter a price between ₦800 and ₦2,500 per kg.'); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'sellers', userId), {
        pricePerKg: p,
        kgInStock: stock,
        updatedAt: new Date().toISOString()
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err: any) {
      alert('Could not save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  /* --- orders (unchanged logic, new clothes) --- */
  useEffect(() => {
    const q = query(collection(db, 'orders'), where('sellerId', '==', userId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList: Order[] = [];
      let totalRevenue = 0, pendingCount = 0, confirmedCount = 0, deliveredCount = 0;
      snapshot.docs.forEach(docSnap => {
        const order = { ...docSnap.data(), id: docSnap.id } as Order;
        ordersList.push(order);
        if (['paid', 'pending_payment', 'pending_cash'].includes(order.status)) pendingCount++;
        else if (['confirmed', 'out_for_delivery'].includes(order.status)) confirmedCount++;
        else if (['delivered', 'completed'].includes(order.status)) { deliveredCount++; totalRevenue += order.totalAmount || 0; }
      });
      setOrders(ordersList);
      setStats({ total: ordersList.length, pending: pendingCount, confirmed: confirmedCount, delivered: deliveredCount, revenue: totalRevenue });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/order-status', { method: 'POST', headers, body: JSON.stringify({ orderId, status: newStatus }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (err: any) { alert(err.message || 'Failed to update order. Try again.'); }
  };

  const unlockEscrow = async (orderId: string) => {
    const code = doorInputs[orderId];
    if (!code) { alert('Ask the buyer for the Door Code at the door.'); return; }
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/release-escrow', { method: 'POST', headers, body: JSON.stringify({ orderId, action: 'seller_code', doorCode: code }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      alert('Door Code matched. Escrow is released to you.');
    } catch (err: any) { alert(err.message || 'Could not unlock escrow'); }
  };

  const confirmPaystack = async (order: Order) => {
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/verify-payment', { method: 'POST', headers, body: JSON.stringify({ orderId: order.id, reference: order.paystackRef || undefined }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Paystack has not confirmed this payment');
    } catch (err: any) { alert(err.message || 'Could not confirm payment'); }
  };

  const completeCash = async (orderId: string) => {
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/release-escrow', { method: 'POST', headers, body: JSON.stringify({ orderId, action: 'cash' }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (err: any) { alert(err.message || 'Could not complete cash order'); }
  };

  const liveStatus = (order: Order) =>
    order.paymentStatus === 'paid' && ['pending_payment', 'pending'].includes(order.status) ? 'paid' : order.status;

  const filtered = orders.filter(o => {
    const st = liveStatus(o);
    if (activeTab === 'new') return ['pending_payment', 'paid', 'pending', 'pending_cash'].includes(st);
    if (activeTab === 'active') return ['confirmed', 'out_for_delivery'].includes(st);
    return ['delivered', 'completed'].includes(st);
  });

  const statusLabel: Record<string, string> = {
    pending_payment: 'Awaiting Payment', pending_cash: 'Cash — confirm when paid', paid: 'Paid — Accept Order',
    confirmed: 'Confirmed — Deliver', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', completed: 'Completed'
  };
  const nextAction: Record<string, { label: string; next: string; icon: any }> = {
    paid: { label: 'ACCEPT ORDER', next: 'confirmed', icon: CheckCircle },
    confirmed: { label: 'Out for Delivery', next: 'out_for_delivery', icon: Truck },
    out_for_delivery: { label: 'Mark Delivered', next: 'delivered', icon: CheckCircle }
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: '#f4f6f8', paddingTop: 'env(safe-area-inset-top)' }}>

      {/* ===== STORE HEADER ===== */}
      <div className="px-4 pt-4 pb-5 rounded-b-3xl" style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/ogas-icon.svg" alt="OGas" className="w-11 h-11 rounded-full bg-white object-cover" />
            <div>
              <h1 className="text-white font-extrabold text-[16px] leading-tight">{sellerData?.businessName || 'My Store'}</h1>
              <p className="text-[10px]" style={{ color: '#8fa6c9' }}>{sellerData?.address || ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/chat" className="p-2" aria-label="Messages"><MessageSquare size={18} color="#fff" /></Link>
            <button onClick={() => { window.location.href = '/'; }} className="p-2" aria-label="Exit"><LogOut size={18} color="#8fa6c9" /></button>
          </div>
        </div>

        {/* OPEN / CLOSED — the big switch */}
        <button onClick={toggleOpen}
          className="w-full flex items-center justify-between rounded-2xl px-4 py-3.5"
          style={{ background: isOpen ? 'rgba(15,169,88,.18)' : 'rgba(231,76,60,.15)', border: `1.5px solid ${isOpen ? '#0fa958' : '#e74c3c'}` }}>
          <span className="flex items-center gap-2.5">
            <Power size={18} color={isOpen ? '#0fa958' : '#e74c3c'} />
            <span className="text-left">
              <span className="block text-white font-extrabold text-[15px]">{isOpen ? 'STORE OPEN' : 'STORE CLOSED'}</span>
              <span className="block text-[9.5px]" style={{ color: '#9fb4d8' }}>{isOpen ? 'Customers can see and order from you' : 'You are hidden from the marketplace'}</span>
            </span>
          </span>
          <span className="w-12 h-7 rounded-full relative transition-colors" style={{ background: isOpen ? '#0fa958' : '#5b616b' }}>
            <span className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all" style={{ left: isOpen ? 26 : 4 }} />
          </span>
        </button>
      </div>

      {/* ===== INVENTORY PANEL ===== */}
      <div className="px-4 -mt-0 pt-3">
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
          <div className="text-[10px] font-extrabold tracking-wider mb-3" style={{ color: '#5b616b' }}>MY INVENTORY</div>

          <label className="block text-[11px] font-bold mb-1.5" style={{ color: NAVY }}>Price per kg</label>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[18px] font-black" style={{ color: NAVY }}>₦</span>
            <input type="number" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)}
              className="flex-1 text-[22px] font-black rounded-xl px-3 py-2.5 outline-none"
              style={{ color: NAVY, background: '#f4f6f8', border: '1.5px solid #e6e9ee' }} placeholder="1350" />
          </div>

          <label className="block text-[11px] font-bold mb-1.5" style={{ color: NAVY }}>Gas in stock (kg)</label>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setStock(Math.max(0, stock - 5))}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: NAVY }}><Minus size={16} /></button>
            <div className="flex-1 text-center">
              <span className="text-[26px] font-black" style={{ color: TEAL }}>{stock}</span>
              <span className="text-[11px] font-bold ml-1" style={{ color: '#8a8f98' }}>kg</span>
            </div>
            <button onClick={() => setStock(stock + 5)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: TEAL }}><Plus size={16} /></button>
          </div>

          <button onClick={saveInventory} disabled={saving}
            className="w-full text-white font-extrabold text-[13px] py-3.5 rounded-xl flex items-center justify-center gap-2"
            style={{ background: savedFlash ? '#0fa958' : NAVY, boxShadow: '0 4px 10px rgba(22,48,94,.25)' }}>
            <Save size={15} /> {saving ? 'Saving…' : savedFlash ? '✓ Saved — Live on marketplace' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>

      {/* ===== WALK-IN SALE ===== */}
      <div className="px-4 mt-3">
        <WalkInSaleButton shopId={userId} />
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-4 gap-2 px-4 mt-3">
        <StatCard value={stats.total} label="Total" color={NAVY} />
        <StatCard value={stats.pending} label="New" color="#e6a700" />
        <StatCard value={stats.confirmed} label="Active" color={TEAL} />
        <StatCard value={`₦${(stats.revenue / 1000).toFixed(0)}k`} label="Earned" color="#0fa958" />
      </div>

      {/* ===== PAYOUT ===== */}
      <div className="px-4 mt-3 space-y-2">
        <Link href="/seller/bank"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[12px] font-bold"
          style={{ background: '#e7f9ee', color: '#0fa958', border: '1.5px solid #b7e8cd' }}>
          <Banknote size={15} /> Set Payout Account
        </Link>
      </div>

      {/* ===== ORDER TABS ===== */}
      <div className="px-4 mt-4 mb-3">
        <div className="flex gap-1.5 bg-white rounded-xl p-1" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
          {(['new', 'active', 'completed'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-lg text-[11px] font-bold transition"
              style={activeTab === tab
                ? { background: NAVY, color: '#fff' }
                : { color: '#8a8f98' }}>
              {tab === 'new' ? 'New' : tab === 'active' ? 'Active' : 'Done'}
              {tab === 'new' && stats.pending > 0 && (
                <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full text-white" style={{ background: '#e74c3c' }}>{stats.pending}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ===== ORDERS ===== */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-[12px]" style={{ color: '#8a8f98' }}>Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Package size={40} style={{ color: '#d3dbe3' }} className="mx-auto mb-3" />
            <p className="text-[12px] font-bold" style={{ color: NAVY }}>No {activeTab} orders</p>
            {activeTab === 'new' && <p className="text-[11px] mt-1" style={{ color: '#8a8f98' }}>New orders appear here the moment customers pay</p>}
          </div>
        ) : filtered.map(order => {
          const st = liveStatus(order);
          const act = nextAction[st];
          return (
            <div key={order.id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
              <div className="p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold px-2 py-1 rounded-full"
                      style={st === 'delivered' || st === 'completed'
                        ? { background: '#e7f9ee', color: '#0fa958' }
                        : { background: '#fff4e0', color: '#b35400' }}>
                      {statusLabel[st] || st}
                    </span>
                    <span className="text-[10px]" style={{ color: '#8a8f98' }}>
                      {order.createdAt?.toDate?.().toLocaleDateString?.() || 'Recent'}
                    </span>
                  </div>
                  <span className="font-black text-[14px]" style={{ color: NAVY }}>₦{order.totalAmount?.toLocaleString()}</span>
                </div>

                <div className="space-y-1 text-[11.5px]" style={{ color: '#5b616b' }}>
                  <div className="flex items-center gap-2">
                    <Flame size={12} color={TEAL} />
                    {order.items?.map((item: any, i) => (
                      <span key={i}>{item.quantity}x {item.size}kg</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} color={NAVY} />
                    <span className="truncate">{order.deliveryType === 'pickup' ? 'Customer will pickup' : (order.buyerAddress || 'No address')}</span>
                  </div>
                  {order.buyerPhone && <div className="text-[10.5px]" style={{ color: '#8a8f98' }}>☎ {order.buyerPhone}</div>}
                </div>

                {act && (
                  <button onClick={() => updateOrderStatus(order.id, act.next)}
                    className="mt-3 w-full text-white font-black text-[14px] py-3.5 rounded-xl flex items-center justify-center gap-2"
                    style={{ background: TEAL, boxShadow: '0 3px 8px rgba(18,165,176,.35)' }}>
                    <act.icon size={17} /> {act.label}
                  </button>
                )}
              </div>

              {(st === 'pending_payment' || st === 'pending') && (
                <div className="px-3.5 pb-3.5 space-y-2">
                  <p className="text-[10px]" style={{ color: '#b35400' }}>Paystack has the charge but this order is not marked paid yet. Tap once to confirm.</p>
                  <button onClick={() => confirmPaystack(order)}
                    className="w-full text-white font-extrabold text-[13px] py-3 rounded-xl" style={{ background: NAVY }}>
                    Confirm payment
                  </button>
                </div>
              )}

              {st === 'pending_cash' && (
                <div className="px-3.5 pb-3.5 space-y-2">
                  <p className="text-[10px]" style={{ color: '#8a8f98' }}>Cash order. Confirm only after you have the money in hand.</p>
                  <button onClick={() => completeCash(order.id)}
                    className="w-full text-white font-bold text-[12px] py-2.5 rounded-xl" style={{ background: '#0fa958' }}>
                    Customer paid cash
                  </button>
                </div>
              )}

              {['paid', 'confirmed', 'out_for_delivery', 'delivered'].includes(st) && (
                <div className="px-3.5 pb-3.5 space-y-2">
                  <p className="text-[10px] flex items-center gap-1" style={{ color: '#8a8f98' }}>
                    <KeyRound size={11} /> Ask the buyer for the Door Code — that is how you get paid.
                  </p>
                  <div className="flex gap-2">
                    <input value={doorInputs[order.id] || ''}
                      onChange={(e) => setDoorInputs({ ...doorInputs, [order.id]: e.target.value.toUpperCase() })}
                      placeholder="DOOR CODE"
                      className="flex-1 rounded-xl px-3 py-2.5 text-[12px] tracking-[0.25em] uppercase outline-none"
                      style={{ background: '#f4f6f8', border: '1.5px solid #e6e9ee', color: NAVY }} />
                    <button onClick={() => unlockEscrow(order.id)}
                      className="px-5 text-white font-bold rounded-xl text-[12px]" style={{ background: '#0fa958' }}>
                      Unlock
                    </button>
                  </div>
                </div>
              )}

              <div className="px-3.5 pb-3.5">
                <ChatButton orderId={order.id} label="Message buyer" />
              </div>

              {st === 'completed' && (
                <div className="px-3.5 pb-3.5 flex items-center justify-center gap-2 text-[11px] font-bold" style={{ color: '#0fa958' }}>
                  <Star size={12} fill="currentColor" /> Order Completed
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== FOOTER LINKS ===== */}
      <div className="px-4 mt-6 space-y-2">
        <Link href="/profile" className="flex items-center justify-between bg-white rounded-xl px-4 py-3 text-[11.5px] font-bold" style={{ color: '#5b616b', boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
          View Public Profile <span style={{ color: '#c3cbd4' }}>›</span>
        </Link>
        <button onClick={refreshStore} className="w-full text-center text-[10.5px] py-2" style={{ color: '#8a8f98' }}>↻ Refresh store data</button>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-2.5 text-center" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
      <p className="text-[15px] font-black" style={{ color }}>{value}</p>
      <p className="text-[9px] font-bold" style={{ color: '#8a8f98' }}>{label}</p>
    </div>
  );
}
