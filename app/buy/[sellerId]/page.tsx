'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '../../context/AuthContext';
import { authHeaders, saveBuyerContact } from '@/lib/client-auth';
import { readApiJson } from '@/lib/read-api-json';
import { MapPin, Star, Truck, Store, CreditCard, Banknote, ChevronLeft, Lock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { moneyToKg, SCALE_STEP } from '@/lib/gasCalculator';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

interface Seller {
  id: string;
  businessName: string;
  address: string;
  phone: string;
  pricePerKg: number;
  deliveryFee: number;
  rating?: number;
  totalOrders?: number;
  isOnline?: boolean;
  isApproved?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const BOTTLE_SIZES = [3, 6, 12, 12.5];

// Show area level only — the exact street stays private until an order exists
const shortAddress = (addr: string) => {
  if (!addr) return '';
  const parts = addr.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 3) return addr;
  return parts.slice(-3).join(', ');
};

export default function BuyPage() {
  const { sellerId } = useParams();
  const router = useRouter();
  const { user } = useAuthContext();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [kg, setKg] = useState(12);
  const [buyMode, setBuyMode] = useState<'money' | 'bottle'>('money');
  const [money, setMoney] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'cash'>('cash');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [contactSaved, setContactSaved] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    getDoc(doc(db, 'sellers', sellerId as string)).then((snap) => {
      if (snap.exists()) {
        setSeller({ id: snap.id, ...snap.data() } as Seller);
      }
      setLoading(false);
    });
  }, [sellerId]);

  // If the buyer is signed in and their number is on file, don't ask again
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data() as any;
      if (d.phone && String(d.phone).replace(/\D/g, '').length >= 10) {
        setBuyerPhone(d.phone);
        setBuyerName(d.name || d.displayName || user.displayName || '');
        setContactSaved(true);
      }
    });
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f8' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: TEAL }}></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-3" style={{ background: '#f4f6f8', color: '#8a8f98' }}>
        <p className="font-bold">Seller not found</p>
        <Link href="/" className="font-bold" style={{ color: TEAL }}>← Back to marketplace</Link>
      </div>
    );
  }

  if (!seller.pricePerKg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-3" style={{ background: '#f4f6f8', color: '#8a8f98' }}>
        <p>This seller hasn't set a price yet.</p>
        <Link href="/" className="font-bold" style={{ color: TEAL }}>Browse other sellers</Link>
      </div>
    );
  }

  const originalPrice = seller.pricePerKg;
  const discountedPrice = originalPrice;
  const cash = Number(String(money).replace(/[^0-9.]/g, '')) || 0;
  const moneyFill = moneyToKg(cash, originalPrice);
  const fillKg = buyMode === 'money' ? moneyFill.kg : kg;
  const gasCost = buyMode === 'money' ? moneyFill.gasCost : Math.round(discountedPrice * kg);
  const change = buyMode === 'money' ? moneyFill.change : 0;
  const deliveryFee = deliveryType === 'pickup' ? 0 : (seller.deliveryFee || 500);
  const totalAmount = gasCost + deliveryFee;
  const totalDiscount = 0;
  const isPendingApproval = seller.isApproved === false;
  const isValid =
    fillKg >= SCALE_STEP &&
    fillKg <= 50 &&
    !isPendingApproval &&
    buyerPhone.replace(/\D/g, '').length >= 10 &&
    (deliveryType === 'pickup' || buyerAddress.trim().length >= 3);

  const naira = (n: number) => `₦${Number(n).toLocaleString()}`;

  const placeOrder = async () => {
    if (!isValid) return;
    setPlacingOrder(true);

    try {
      await saveBuyerContact(buyerPhone, buyerName, buyerAddress);
      const headers = await authHeaders();
      const createRes = await fetch('/api/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sellerId: seller.id,
          kg: fillKg,
          deliveryType,
          paymentMethod,
          buyerPhone,
          buyerName,
          buyerAddress: deliveryType === 'pickup' ? 'Pickup in store' : buyerAddress,
        }),
      });
      const created = await readApiJson(createRes);
      if (!created.success || !created.orderId) {
        throw new Error(created.message || 'Failed to place order');
      }

      if (created.doorCode) {
        try {
          sessionStorage.setItem(`ogas-door-${created.orderId}`, created.doorCode);
        } catch {
          /* ignore */
        }
      }

      if (paymentMethod === 'paystack') {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            orderId: created.orderId,
            amount: created.totalAmount,
            email: user?.email || '',
            name: buyerName || user?.displayName || '',
            sellerId: seller.id,
          }),
        });
        const data = await readApiJson(res);
        if (data.success && data.authorization_url) {
          window.location.href = data.authorization_url;
        } else {
          throw new Error(data.message || 'Payment initialization failed');
        }
      } else {
        router.push('/orders');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto" style={{ background: '#f4f6f8' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)` }}>
        <Link href="/" className="p-1.5 rounded-full" style={{ background: 'rgba(255,255,255,.12)' }}>
          <ChevronLeft className="w-5 h-5" color="#fff" />
        </Link>
        <div>
          <h1 className="font-extrabold text-sm text-white">{seller.businessName}</h1>
          <div className="flex items-center gap-1 text-[11px]" style={{ color: '#8fa6c9' }}>
            <MapPin className="w-3 h-3" />
            {shortAddress(seller.address)}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {isPendingApproval && (
          <div className="rounded-xl p-2.5 text-center text-xs font-bold" style={{ background: '#fff4e0', border: '1px solid #f0d48a', color: '#b35400' }}>
            This store is pending verification and can't take orders yet.
          </div>
        )}

        {/* Status + price */}
        <div className="rounded-xl px-3 py-2.5 flex items-center justify-between bg-white" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#8a8f98' }}>
            <div className={`w-2 h-2 rounded-full ${seller.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            {seller.isOnline ? 'Online' : 'Offline'}
            <span style={{ color: '#d3dbe3' }}>·</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3" fill="#f5a623" color="#f5a623" />{seller.rating || 4.5}</span>
            <span className="flex items-center gap-1 ml-1" style={{ color: '#0fa958' }}><ShieldCheck className="w-3 h-3" />Verified</span>
          </div>
          <div className="text-sm font-black" style={{ color: NAVY }}>{naira(originalPrice)}<span className="text-[11px] font-semibold" style={{ color: '#8a8f98' }}> /kg</span></div>
        </div>

        {/* Amount or size */}
        <div className="rounded-xl p-3 space-y-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBuyMode('money')}
              className="flex-1 py-2.5 rounded-xl border text-sm font-extrabold"
              style={buyMode === 'money'
                ? { borderColor: NAVY, background: NAVY, color: '#fff' }
                : { borderColor: '#e6e9ee', background: '#fff', color: '#8a8f98' }}
            >
              By amount
            </button>
            <button
              type="button"
              onClick={() => setBuyMode('bottle')}
              className="flex-1 py-2.5 rounded-xl border text-sm font-extrabold"
              style={buyMode === 'bottle'
                ? { borderColor: NAVY, background: NAVY, color: '#fff' }
                : { borderColor: '#e6e9ee', background: '#fff', color: '#8a8f98' }}
            >
              By size
            </button>
          </div>

          {buyMode === 'money' ? (
            <>
              <div className="flex items-center rounded-xl px-3" style={{ background: '#f4f6f8', border: '1.5px solid #e6e9ee' }}>
                <span className="font-black text-lg" style={{ color: TEAL }}>₦</span>
                <input
                  inputMode="numeric"
                  value={money}
                  onChange={(e) => setMoney(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-transparent py-3 px-2 text-lg font-black focus:outline-none"
                  style={{ color: NAVY }}
                />
              </div>
              <p className="text-[11px]" style={{ color: '#8a8f98' }}>
                {cash > 0 && moneyFill.kg >= SCALE_STEP ? (
                  <>You'll get <b style={{ color: NAVY }}>{moneyFill.kg.toFixed(2)} kg</b> · gas {naira(gasCost)}{change > 0 ? <> · change {naira(change)}</> : null}</>
                ) : cash > 0 ? (
                  <>Not enough for 0.05kg ({naira(Math.round(originalPrice * SCALE_STEP))}) — add a little more</>
                ) : (
                  <>Enter the amount you have — we calculate the kg</>
                )}
              </p>
            </>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {BOTTLE_SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setKg(sz)}
                  className="py-2.5 rounded-xl border text-sm font-extrabold"
                  style={kg === sz
                    ? { borderColor: TEAL, background: TEAL, color: '#fff' }
                    : { borderColor: '#e6e9ee', background: '#fff', color: '#8a8f98' }}
                >
                  {sz}kg
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delivery */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDeliveryType('pickup')}
            className="flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 bg-white"
            style={deliveryType === 'pickup'
              ? { borderColor: NAVY, borderWidth: 2, color: NAVY }
              : { borderColor: '#e6e9ee', color: '#8a8f98' }}
          >
            <Store className="w-4 h-4" />
            <span className="text-sm font-extrabold">Pickup <span className="text-[10px] font-semibold">Free</span></span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType('delivery')}
            className="flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 bg-white"
            style={deliveryType === 'delivery'
              ? { borderColor: NAVY, borderWidth: 2, color: NAVY }
              : { borderColor: '#e6e9ee', color: '#8a8f98' }}
          >
            <Truck className="w-4 h-4" />
            <span className="text-sm font-extrabold">Delivery <span className="text-[10px] font-semibold">{naira(seller.deliveryFee || 500)}</span></span>
          </button>
        </div>

        {/* Payment */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className="flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 bg-white"
            style={paymentMethod === 'cash'
              ? { borderColor: TEAL, borderWidth: 2, color: TEAL }
              : { borderColor: '#e6e9ee', color: '#8a8f98' }}
          >
            <Banknote className="w-4 h-4" />
            <span className="text-sm font-extrabold">Cash</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('paystack')}
            className="flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 bg-white"
            style={paymentMethod === 'paystack'
              ? { borderColor: TEAL, borderWidth: 2, color: TEAL }
              : { borderColor: '#e6e9ee', color: '#8a8f98' }}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-sm font-extrabold">Pay online</span>
          </button>
        </div>

        {/* Contact */}
        {(!contactSaved || deliveryType === 'delivery') && (
          <div className="rounded-xl p-3 space-y-2 bg-white" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
            <h3 className="font-extrabold text-sm" style={{ color: NAVY }}>{contactSaved ? 'Delivery address' : 'Your phone number'}</h3>
            {!contactSaved && (
              <>
                <input
                  type="tel"
                  inputMode="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full rounded-xl px-3 py-3 text-sm font-bold focus:outline-none"
                  style={{ background: '#f4f6f8', border: '1.5px solid #e6e9ee', color: NAVY }}
                />
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Name (optional)"
                  className="w-full rounded-xl px-3 py-3 text-sm font-bold focus:outline-none"
                  style={{ background: '#f4f6f8', border: '1.5px solid #e6e9ee', color: NAVY }}
                />
              </>
            )}
            {deliveryType === 'delivery' && (
              <input
                type="text"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                placeholder="Delivery address"
                className="w-full rounded-xl px-3 py-3 text-sm font-bold focus:outline-none"
                style={{ background: '#f4f6f8', border: '1.5px solid #e6e9ee', color: NAVY }}
              />
            )}
          </div>
        )}

        <p className="flex items-center justify-center gap-1 text-[10px] px-2" style={{ color: '#8a8f98' }}>
          <Lock className="w-3 h-3" />
          Exact location and contact are shared after you order. Chat in-app to talk to the shop.
        </p>
      </div>

      {/* Sticky order bar */}
      <div className="sticky bottom-16 z-10 px-4 py-3 flex items-center gap-3 bg-white border-t" style={{ borderColor: '#eee', boxShadow: '0 -4px 12px rgba(20,30,50,.06)' }}>
        <div className="min-w-0">
          <div className="font-black text-lg leading-tight" style={{ color: NAVY }}>{naira(totalAmount)}</div>
          <div className="text-[11px] truncate" style={{ color: '#8a8f98' }}>
            {fillKg.toFixed(2)}kg
            {change > 0 ? ` · change ${naira(change)}` : ''}
            {' · '}{deliveryType === 'pickup' ? 'Pickup · Free' : `Delivery · ${naira(deliveryFee)}`}
            {paymentMethod === 'paystack' ? ' · Escrow protected' : ''}
          </div>
        </div>
        <button
          onClick={placeOrder}
          disabled={placingOrder || !isValid}
          className="ml-auto px-5 py-3 rounded-xl font-extrabold text-sm whitespace-nowrap transition text-white"
          style={isValid && !placingOrder
            ? { background: TEAL, boxShadow: '0 4px 10px rgba(18,165,176,.4)' }
            : { background: '#c3cbd4', cursor: 'not-allowed' }}
        >
          {placingOrder ? 'Placing...' : paymentMethod === 'paystack' ? `Pay ${naira(totalAmount)}` : 'Place order'}
        </button>
      </div>
    </div>
  );
}
