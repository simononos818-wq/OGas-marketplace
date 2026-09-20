'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '../../context/AuthContext';
import { authHeaders, saveBuyerContact } from '@/lib/client-auth';
import { readApiJson } from '@/lib/read-api-json';
import { MapPin, Star, Truck, Store, CreditCard, Banknote, ChevronLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { moneyToKg, SCALE_STEP } from '@/lib/gasCalculator';

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
  const [money, setMoney] = useState('3000');
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        Seller not found
      </div>
    );
  }

  if (!seller.pricePerKg) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-gray-400 px-4 text-center gap-3">
        <p>This seller hasn't set a price yet.</p>
        <Link href="/buy" className="text-orange-400 underline">Browse other sellers</Link>
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
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-gray-900">
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800 px-4 py-2.5 flex items-center gap-3">
        <Link href="/" className="p-1.5 hover:bg-gray-800 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold text-sm">{seller.businessName}</h1>
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <MapPin className="w-3 h-3" />
            {shortAddress(seller.address)}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {isPendingApproval && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-2.5 text-center text-yellow-400 text-xs">
            This store is pending verification and can't take orders yet.
          </div>
        )}

        <div className="bg-gray-900 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-2 h-2 rounded-full ${seller.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            {seller.isOnline ? 'Online' : 'Offline'}
            <span className="text-gray-600">·</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{seller.rating || 4.5}</span>
          </div>
          <div className="text-sm font-bold">{naira(originalPrice)}<span className="text-[11px] text-gray-400 font-normal"> /kg</span></div>
        </div>

        <div className="bg-gray-900 rounded-xl p-3 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBuyMode('money')}
              className={`flex-1 py-2 rounded-lg border text-sm font-bold ${buyMode === 'money' ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-400'}`}
            >
              By amount
            </button>
            <button
              type="button"
              onClick={() => setBuyMode('bottle')}
              className={`flex-1 py-2 rounded-lg border text-sm font-bold ${buyMode === 'bottle' ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-400'}`}
            >
              By size
            </button>
          </div>

          {buyMode === 'money' ? (
            <>
              <div className="flex items-center bg-gray-800 rounded-lg px-3">
                <span className="text-gray-400 font-bold">₦</span>
                <input
                  inputMode="numeric"
                  value={money}
                  onChange={(e) => setMoney(e.target.value)}
                  placeholder="3000"
                  className="w-full bg-transparent py-2.5 px-2 text-base font-bold text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                {cash > 0 && moneyFill.kg >= SCALE_STEP ? (
                  <>You'll get <b className="text-white">{moneyFill.kg.toFixed(2)} kg</b> · gas {naira(gasCost)}{change > 0 ? <> · change {naira(change)}</> : null}</>
                ) : cash > 0 ? (
                  <>Not enough for 0.05kg ({naira(Math.round(originalPrice * SCALE_STEP))}) — add a little more</>
                ) : (
                  <>Enter the amount you have</>
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
                  className={`py-2 rounded-lg border text-sm font-bold ${kg === sz ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-400'}`}
                >
                  {sz}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDeliveryType('pickup')}
            className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 ${deliveryType === 'pickup' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900'}`}
          >
            <Store className="w-4 h-4" />
            <span className="text-sm font-bold">Pickup <span className="text-[10px] font-normal text-gray-400">Free</span></span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType('delivery')}
            className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 ${deliveryType === 'delivery' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900'}`}
          >
            <Truck className="w-4 h-4" />
            <span className="text-sm font-bold">Delivery <span className="text-[10px] font-normal text-gray-400">{naira(seller.deliveryFee || 500)}</span></span>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900'}`}
          >
            <Banknote className="w-4 h-4" />
            <span className="text-sm font-bold">Cash</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('paystack')}
            className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 ${paymentMethod === 'paystack' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900'}`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-sm font-bold">Pay online</span>
          </button>
        </div>

        {(!contactSaved || deliveryType === 'delivery') && (
          <div className="bg-gray-900 rounded-xl p-3 space-y-2">
            <h3 className="font-bold">{contactSaved ? 'Delivery address' : '4. Your phone number'}</h3>
            {!contactSaved && (
              <>
                <input
                  type="tel"
                  inputMode="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full bg-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Name (optional)"
                  className="w-full bg-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </>
            )}
            {deliveryType === 'delivery' && (
              <input
                type="text"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                placeholder="Delivery address"
                className="w-full bg-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            )}
          </div>
        )}

        <p className="flex items-center justify-center gap-1 text-[10px] text-gray-600 px-2">
          <Lock className="w-3 h-3" />
          Exact location and contact are shared after you order. Chat in-app to talk to the shop.
        </p>
      </div>

      <div className="sticky bottom-16 z-10 bg-gray-950/95 backdrop-blur border-t border-gray-800 px-4 py-3 flex items-center gap-3">
        <div className="min-w-0">
          <div className="font-bold text-lg leading-tight">{naira(totalAmount)}</div>
          <div className="text-[11px] text-gray-500 truncate">
            {fillKg.toFixed(2)}kg
            {change > 0 ? ` · change ${naira(change)}` : ''}
            {' · '}{deliveryType === 'pickup' ? 'Pickup · Free' : `Delivery · ${naira(deliveryFee)}`}
            {paymentMethod === 'paystack' ? ' · Escrow protected' : ''}
          </div>
        </div>
        <button
          onClick={placeOrder}
          disabled={placingOrder || !isValid}
          className={`ml-auto px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition ${
            isValid && !placingOrder
              ? 'bg-orange-500 text-black hover:bg-orange-400'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {placingOrder ? 'Placing...' : paymentMethod === 'paystack' ? `Pay ${naira(totalAmount)}` : 'Place order'}
        </button>
      </div>
    </div>
  );
}
