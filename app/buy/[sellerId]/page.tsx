'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { authHeaders, saveBuyerContact } from '@/lib/client-auth';
import { MapPin, Star, Truck, Store, CreditCard, Banknote, ChevronLeft, Flame, Tag, Lock } from 'lucide-react';
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
  const [buyerLocation, setBuyerLocation] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');

  useEffect(() => {
    if (!sellerId) return;
    getDoc(doc(db, 'sellers', sellerId as string)).then((snap) => {
      if (snap.exists()) {
        setSeller({ id: snap.id, ...snap.data() } as Seller);
      }
      setLoading(false);
    });
  }, [sellerId]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setBuyerLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        () => {
          setBuyerLocation('Location access denied');
        }
      );
    }
  }, []);

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
      await saveBuyerContact(buyerPhone, buyerName, buyerAddress || buyerLocation);
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
          buyerAddress: deliveryType === 'pickup' ? 'Pickup in store' : buyerAddress || buyerLocation,
        }),
      });
      const created = await createRes.json();
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
        const data = await res.json();
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
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold">{seller.businessName}</h1>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3" />
            {shortAddress(seller.address)}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {isPendingApproval && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-2xl p-3 text-center text-yellow-400 text-sm">
            This store is pending verification and can't take orders yet.
          </div>
        )}

        <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${seller.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-sm">{seller.isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm">{seller.rating || 4.5}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            Exact location and contact are shared after you order. Chat in-app to talk to the shop.
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <div className="text-sm text-gray-400">Today</div>
          <div className="text-2xl font-bold text-white">{naira(originalPrice)} = 1kg</div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold">1. How would you like to buy?</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setBuyMode('money')}
              className={`p-3 rounded-xl border-2 text-left ${buyMode === 'money' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-800'}`}
            >
              <div className="font-bold">I have a budget</div>
              <div className="text-xs text-gray-400">Enter amount — see your kg</div>
            </button>
            <button
              type="button"
              onClick={() => setBuyMode('bottle')}
              className={`p-3 rounded-xl border-2 text-left ${buyMode === 'bottle' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-800'}`}
            >
              <div className="font-bold">I know my size</div>
              <div className="text-xs text-gray-400">Choose cylinder size</div>
            </button>
          </div>

          {buyMode === 'money' ? (
            <>
              <label className="text-sm text-gray-400">How much do you have?</label>
              <input
                inputMode="numeric"
                value={money}
                onChange={(e) => setMoney(e.target.value)}
                placeholder="3000"
                className="w-full mt-1 bg-gray-800 rounded-xl px-4 py-3 text-xl font-bold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="mt-3 text-sm">
                {cash > 0 && moneyFill.kg >= SCALE_STEP ? (
                  <>
                    You'll get <b>{moneyFill.kg.toFixed(2)} kg</b> — gas costs {naira(gasCost)}
                    {change > 0 ? <> · change {naira(change)}</> : null}
                  </>
                ) : cash > 0 ? (
                  <>Not enough for the minimum refill (0.05kg = {naira(Math.round(originalPrice * SCALE_STEP))}). Add a little more.</>
                ) : (
                  <>Enter the amount you have.</>
                )}
              </p>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {BOTTLE_SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setKg(sz)}
                  className={`p-3 rounded-xl border-2 ${kg === sz ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-800'}`}
                >
                  <div className="font-bold">{sz}kg</div>
                  <div className="text-xs text-gray-400">{naira(Math.round(originalPrice * sz))}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-2xl p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-500" />
            2. How do you want it?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryType('pickup')}
              className={`p-3 rounded-xl border-2 transition ${
                deliveryType === 'pickup' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-800'
              }`}
            >
              <Store className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm font-bold">Pick up at shop</div>
              <div className="text-xs text-gray-400">FREE</div>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType('delivery')}
              className={`p-3 rounded-xl border-2 transition ${
                deliveryType === 'delivery' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-800'
              }`}
            >
              <Truck className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm font-bold">Deliver to me</div>
              <div className="text-xs text-gray-400">{naira(seller.deliveryFee || 500)}</div>
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4">
          <h3 className="font-bold mb-3">3. Payment method</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition ${
                paymentMethod === 'cash' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-800'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold">Cash</div>
                <div className="text-xs text-gray-400">Pay at the shop</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('paystack')}
              className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition ${
                paymentMethod === 'paystack' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-800'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold">Pay online</div>
                <div className="text-xs text-gray-400">Card · Transfer · USSD</div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
          <h3 className="font-bold">4. Your phone number</h3>
          <input
            type="tel"
            inputMode="tel"
            value={buyerPhone}
            onChange={(e) => setBuyerPhone(e.target.value)}
            placeholder="0803 000 0000"
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="text"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="Name (optional)"
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {deliveryType === 'delivery' && (
            <input
              type="text"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              placeholder="Delivery address"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          )}
        </div>

        <div className="bg-gray-900 rounded-2xl p-4">
          <h3 className="font-bold mb-3">Your order</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{fillKg.toFixed(2)}kg × {naira(discountedPrice)}</span>
              <span>{naira(gasCost)}</span>
            </div>
            {buyMode === 'money' && change > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Change</span>
                <span>{naira(change)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span>Delivery</span>
              <span>{deliveryType === 'pickup' ? 'FREE' : naira(deliveryFee)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-400">
                <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> OGas Discount</span>
                <span>-{naira(totalDiscount)}</span>
              </div>
            )}
            <div className="border-t border-gray-800 pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-orange-400">{naira(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={placeOrder}
          disabled={placingOrder || !isValid}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition ${
            isValid && !placingOrder
              ? 'bg-orange-500 text-black hover:bg-orange-400'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {placingOrder
            ? 'Placing your order...'
            : paymentMethod === 'paystack'
              ? `Pay ${naira(totalAmount)} — secure with escrow`
              : `Place order · ${naira(totalAmount)}`}
        </button>
        {paymentMethod === 'paystack' && (
          <p className="text-center text-xs text-gray-500 mt-2">
            OGas holds your money. The seller is paid only when you give your Door Code at the door.
          </p>
        )}
      </div>
    </div>
  );
}
