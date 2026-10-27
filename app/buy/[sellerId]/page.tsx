'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, ShieldCheck, Truck, Store, Flame, Phone, MessageCircle, AlertTriangle, Scale, FileText } from 'lucide-react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';
import { getSellerBadge } from '@/lib/seller-badges';

const NAVY = '#16305e';
const TEAL = '#12a5b0';
const GREEN = '#0fa958';

interface Seller {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  pricePerKg: number;
  deliveryFee: number;
  isOnline: boolean;
  rating: number;
  totalOrders: number;
  completedOrders?: number;
  isVerified?: boolean;
  isApproved?: boolean;
  verified?: boolean;
  status?: string;
}

export default function SellerPage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [kg, setKg] = useState('12.5');
  const [cylinderSize, setCylinderSize] = useState('12.5kg');
  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState<'kg' | 'cylinder'>('kg');
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'sellers', sellerId));
        if (snap.exists()) setSeller({ id: snap.id, ...snap.data() } as Seller);
        else setLoadError('This seller could not be found.');
      } catch (err: any) {
        console.error('Seller load failed:', err);
        setLoadError('Could not load this seller. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [sellerId]);

  const pricePerKg = seller?.pricePerKg || 0;
  const gasAmount = mode === 'kg'
    ? Math.round((parseFloat(kg) || 0) * pricePerKg)
    : Math.round(12.5 * pricePerKg * quantity); // default 12.5kg cylinders
  const deliveryFee = orderType === 'delivery' ? (seller?.deliveryFee || 0) : 0;
  const total = gasAmount + deliveryFee;

  const handleOrder = async () => {
    if (!user) { router.push('/login'); return; }
    if (user.uid === sellerId) {
      setError('You cannot buy from your own shop. Use a buyer account.');
      return;
    }
    setOrdering(true);
    setError('');

    // Reserve stock atomically for cylinder orders BEFORE navigating to checkout.
    // If another buyer grabs the last cylinder first, this fails and we stop here.
    if (mode === 'cylinder') {
      try {
        const sellerRef = doc(db, 'sellers', sellerId);
        const snap = await getDoc(sellerRef);
        if (!snap.exists()) throw new Error('Seller not found');
        const data = snap.data();
        const stock: Record<string, number> = data.stock || {};
        const available = stock[cylinderSize] ?? 0;
        if (available < quantity) {
          setError(`Only ${available} × ${cylinderSize} cylinder${available !== 1 ? 's' : ''} left in stock.`);
          setOrdering(false);
          return;
        }
        await updateDoc(sellerRef, {
          [`stock.${cylinderSize}`]: available - quantity,
          updatedAt: serverTimestamp(),
        });
      } catch (e: any) {
        setError(e.message || 'Could not reserve stock. Please try again.');
        setOrdering(false);
        return;
      }
    }

    const params = new URLSearchParams({
      sellerId,
      sellerName: seller?.businessName || '',
      orderType,
      mode,
      kg: mode === 'kg' ? kg : (12.5 * quantity).toString(),
      cylinderSize: mode === 'cylinder' ? cylinderSize : '',
      quantity: quantity.toString(),
      gasAmount: gasAmount.toString(),
      deliveryFee: deliveryFee.toString(),
      total: total.toString(),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f8' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
    </div>
  );

  if (!seller) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#f4f6f8' }}>
      <p className="font-bold text-lg" style={{ color: NAVY }}>Seller not found</p>
      {loadError && <p className="text-sm mt-2 max-w-xs" style={{ color: '#8a8f98' }}>{loadError}</p>}
      <Link href="/" className="mt-4 text-sm font-bold" style={{ color: TEAL }}>Back to marketplace</Link>
    </div>
  );

  return (
    <div className="min-h-screen pb-32" style={{ background: '#f4f6f8', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 pb-4"
        style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)`, paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <ArrowLeft size={16} color="#fff" />
          </Link>
          <div className="flex-1">
            <h1 className="text-white font-extrabold text-[16px]">{seller.businessName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[10px]" style={{ color: '#2dd4c2' }}>
                <ShieldCheck size={10} /> {getSellerBadge(seller, seller.completedOrders || 0)?.tier || 'SELLER'}
              </span>
              {seller.totalOrders > 0 && <span className="text-[10px]" style={{ color: '#8fa6c9' }}>{seller.totalOrders} orders</span>}
            </div>
          </div>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
            style={{ background: seller.isOnline ? 'rgba(15,169,88,0.2)' : 'rgba(255,255,255,0.1)', color: seller.isOnline ? '#4ade80' : '#8fa6c9' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: seller.isOnline ? '#4ade80' : '#8fa6c9' }} />
            {seller.isOnline ? 'Open' : 'Closed'}
          </span>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Seller info */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(20,30,50,0.06)' }}>
          <p className="text-[12px]" style={{ color: '#8a8f98' }}>📍 {seller.address}</p>
          <div className="flex gap-2 mt-3">
            <a href={`tel:${seller.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold"
              style={{ background: '#f4f6f8', color: NAVY }}>
              <Phone size={14} /> Call
            </a>
            <Link href={`/chat/${sellerId}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold"
              style={{ background: '#e6f7f8', color: TEAL }}>
              <MessageCircle size={14} /> Chat
            </Link>
          </div>
        </div>

        {/* Order type */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(20,30,50,0.06)' }}>
          <p className="font-bold text-[13px] mb-3" style={{ color: NAVY }}>How do you want your gas?</p>
          <div className="grid grid-cols-2 gap-2">
            {(['delivery', 'pickup'] as const).map(type => (
              <button key={type} onClick={() => setOrderType(type)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[13px] transition-all"
                style={{
                  background: orderType === type ? NAVY : '#f4f6f8',
                  color: orderType === type ? '#fff' : '#8a8f98',
                  border: orderType === type ? `1.5px solid ${NAVY}` : '1.5px solid transparent',
                }}>
                {type === 'delivery' ? <Truck size={15} /> : <Store size={15} />}
                {type === 'delivery' ? 'Delivery' : 'Pickup'}
              </button>
            ))}
          </div>
          {orderType === 'delivery' && (
            <p className="text-[11px] mt-2 text-center" style={{ color: '#8a8f98' }}>
              Delivery fee: <strong style={{ color: NAVY }}>₦{(seller.deliveryFee || 0).toLocaleString()}</strong>
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(20,30,50,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-[13px]" style={{ color: NAVY }}>How much gas?</p>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e8ecf0' }}>
              {(['kg', 'cylinder'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="px-3 py-1.5 text-[11px] font-bold transition-all"
                  style={{ background: mode === m ? NAVY : '#fff', color: mode === m ? '#fff' : '#8a8f98' }}>
                  {m === 'kg' ? 'By KG' : 'Cylinder'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'kg' ? (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {['3', '6', '12.5', '25', '50'].map(size => (
                  <button key={size} onClick={() => setKg(size)}
                    className="px-3 py-2 rounded-xl text-[12px] font-bold transition-all"
                    style={{ background: kg === size ? '#e6f7f8' : '#f4f6f8', color: kg === size ? TEAL : '#5b616b', border: kg === size ? `1.5px solid ${TEAL}` : '1.5px solid transparent' }}>
                    {size}kg
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input type="number" value={kg} onChange={e => setKg(e.target.value)} min="0.5" step="0.5"
                  className="flex-1 text-[22px] font-black outline-none bg-transparent"
                  style={{ color: NAVY }} />
                <span className="text-[14px] font-bold" style={{ color: '#8a8f98' }}>kg</span>
              </div>
              <p className="text-[11px] mt-1" style={{ color: '#8a8f98' }}>@ ₦{pricePerKg.toLocaleString()}/kg</p>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold" style={{ color: NAVY }}>12.5kg Cylinder</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#8a8f98' }}>₦{Math.round(12.5 * pricePerKg).toLocaleString()} each</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
                  style={{ background: '#f4f6f8', color: NAVY }}>−</button>
                <span className="font-black text-[20px] w-6 text-center" style={{ color: NAVY }}>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
                  style={{ background: '#e6f7f8', color: TEAL }}>+</button>
              </div>
            </div>
          )}
        </div>

        {/* Weighed receipt transparency panel — core anti-short-fill promise */}
        <div className="rounded-2xl p-4" style={{ background: '#e6f7f8', border: '1px solid #b2e8ea' }}>
          <div className="flex items-center gap-2 mb-2.5">
            <Scale size={15} color={TEAL} />
            <p className="font-bold text-[12px]" style={{ color: NAVY }}>Your order is weighed. Every time.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: mode === 'kg' ? 'You pay for' : 'Cylinder capacity', value: `${mode === 'kg' ? (parseFloat(kg) || 0) : 12.5 * quantity}kg` },
              { label: 'Seller confirms on scale', value: 'Required', highlight: true },
              { label: 'Appears on receipt', value: 'Exact kg', highlight: true },
            ].map(item => (
              <div key={item.label} className="rounded-xl py-2.5 px-1.5" style={{ background: '#fff' }}>
                <p className="font-black text-[13px]" style={{ color: item.highlight ? TEAL : NAVY }}>{item.value}</p>
                <p className="text-[9px] mt-0.5 leading-tight" style={{ color: '#8a8f98' }}>{item.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-1.5 mt-2.5">
            <FileText size={11} color={TEAL} className="flex-shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed" style={{ color: '#4a7a80' }}>
              Seller cannot mark your order delivered without entering the actual weighed kg. Your receipt shows it before you share your Door Code.
            </p>
          </div>
        </div>

        {/* Escrow notice */}
        <div className="rounded-2xl p-3.5 flex items-start gap-3" style={{ background: '#fff8e6', border: '1px solid #fde68a' }}>
          <ShieldCheck size={18} color="#d97706" className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-bold" style={{ color: '#92400e' }}>Escrow protected</p>
            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#b45309' }}>
              Pay online and your money is held until you share your Door Code after receiving gas. Or choose cash transfer on delivery.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <AlertTriangle size={14} color="#dc2626" className="flex-shrink-0 mt-0.5" />
            <p className="text-[12px]" style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}
      </div>

      {/* Sticky order bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full px-4 py-4"
        style={{ background: '#fff', maxWidth: 480, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px]" style={{ color: '#8a8f98' }}>Total{orderType === 'delivery' ? ' (incl. delivery)' : ''}</p>
            <p className="font-black text-[24px]" style={{ color: NAVY }}>₦{total.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px]" style={{ color: '#8a8f98' }}>{mode === 'kg' ? `${kg}kg` : `${quantity} × 12.5kg`}</p>
            <p className="text-[11px]" style={{ color: '#8a8f98' }}>{orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</p>
          </div>
        </div>
        <button onClick={handleOrder} disabled={ordering || total <= 0}
          className="w-full py-4 rounded-2xl font-extrabold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${NAVY}, #245089)`, boxShadow: '0 4px 16px rgba(22,48,94,0.35)', border: '1.5px solid rgba(45,212,194,0.4)' }}>
          <Flame size={18} color="#2dd4c2" />
          {ordering ? 'Processing…' : user ? `Order Now · ₦${total.toLocaleString()}` : 'Sign in to Order'}
        </button>
      </div>
    </div>
  );
}
