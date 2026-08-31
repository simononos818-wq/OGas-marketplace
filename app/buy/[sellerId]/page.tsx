'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '../../context/AuthContext';
import { authHeaders, saveBuyerContact } from '@/lib/client-auth';
import { MapPin, Phone, Star, Truck, Store, CreditCard, Banknote, ChevronLeft, Flame, Calculator, Tag, CheckCircle } from 'lucide-react';
import Link from 'next/link';

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

const OGAS_DISCOUNT_PER_KG = 0;

export default function BuyPage() {
  const { sellerId } = useParams();
  const router = useRouter();
  const { user } = useAuthContext();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [kg, setKg] = useState(12);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'cash'>('paystack');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [buyerLocation, setBuyerLocation] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-00"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-00">
        Seller not found
      </div>
    );
  }

  if (!seller.pricePerKg) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-gray-00 px-4 text-center gap-3">
        <p>This seller hasn't set a price yet.</p>
        <Link href="/buy" className="text-orange-400 underline">Browse other sellers</Link>
      </div>
    );
  }

  const originalPrice = seller.pricePerKg;
  const discountedPrice = originalPrice;
  const gasCost = discountedPrice * kg;
  const deliveryFee = deliveryType === 'pickup' ? 0 : (seller.deliveryFee || 500);
  const totalAmount = gasCost + deliveryFee;
  const totalDiscount = 0;
  const isPendingApproval = seller.isApproved === false;
  const isValid = kg >= 1 && kg <= 50 && !isPendingApproval && buyerPhone.replace(/\D/g, '').length >= 10 && (deliveryType === 'pickup' || buyerAddress.trim().length >= 3);

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
          kg,
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
      {/* Header */}
      <div className="sticky top-0 z-0 bg-black/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold">{seller.businessName}</h1>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3" />
            {seller.address}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {isPendingApproval && (
          <div className="bg-yellow-00/20 border border-yellow-00 rounded-2xl p-3 text-center text-yellow-400 text-sm">
            ⏳ This store is pending verification and can't take orders yet.
          </div>
        )}
        {/* Seller Info */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${seller.isOnline ? 'bg-green-00' : 'bg-gray-00'}`}></div>
              <span className="text-sm">{seller.isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-00 fill-yellow-00" />
              <span className="text-sm">{seller.rating || 4.5}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Phone className="w-4 h-4" />
            {seller.phone}
          </div>
          <div className="text-xs text-gray-00">
            Your Location: {buyerLocation || 'Detecting...'}
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <div className="text-sm text-gray-400">Price per kg</div>
          <div className="text-2xl font-bold text-white">₦{originalPrice.toLocaleString()}/kg</div>
          <div className="text-xs text-gray-500 mt-1">Set by the plant. No extra fee on the kg price.</div>
        </div>

        {/* KG Selector */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-00" />
              <span className="font-bold">Gas Quantity</span>
            </div>
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="flex items-center gap-1 text-orange-400 text-sm"
            >
              <Calculator className="w-4 h-4" />
              Calculator
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setKg(Math.max(1, kg - 1))}
              className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl font-bold hover:bg-gray-700"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <div className="text-3xl font-bold">{kg} <span className="text-lg text-gray-400">kg</span></div>
              <div className="text-sm text-orange-400">₦{discountedPrice}/kg (was ₦{originalPrice})</div>
            </div>
            <button
              onClick={() => setKg(Math.min(50, kg + 1))}
              className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl font-bold hover:bg-gray-700"
            >
              +
            </button>
          </div>

          {showCalculator && (
            <div className="mt-3 p-3 bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-400 mb-2">Quick Select:</p>
              <div className="flex gap-2 flex-wrap">
                {[3, 5, 6, 12.5, 25, 50].map((size) => (
                  <button
                    key={size}
                    onClick={() => setKg(size)}
                    className="px-3 py-1 bg-gray-700 rounded-lg text-sm hover:bg-orange-00 hover:text-black transition"
                  >
                    {size}kg
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delivery Type */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-00" />
            Delivery Method
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDeliveryType('delivery')}
              className={`p-3 rounded-xl border-2 transition ${
                deliveryType === 'delivery'
                  ? 'border-orange-00 bg-orange-00/10'
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <Truck className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm font-bold">Delivery</div>
              <div className="text-xs text-gray-400">₦{seller.deliveryFee || 500}</div>
            </button>
            <button
              onClick={() => setDeliveryType('pickup')}
              className={`p-3 rounded-xl border-2 transition ${
                deliveryType === 'pickup'
                  ? 'border-orange-00 bg-orange-00/10'
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <Store className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm font-bold">Pickup</div>
              <div className="text-xs text-gray-400">FREE</div>
            </button>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <h3 className="font-bold mb-3">Payment Method</h3>
          <div className="space-y-2">
            <button
              onClick={() => setPaymentMethod('paystack')}
              className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition ${
                paymentMethod === 'paystack'
                  ? 'border-orange-00 bg-orange-00/10'
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold">Pay Online</div>
                <div className="text-xs text-gray-400">Card, Bank Transfer, USSD</div>
              </div>
            </button>
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition ${
                paymentMethod === 'cash'
                  ? 'border-orange-00 bg-orange-00/10'
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold">Cash on {deliveryType === 'pickup' ? 'Pickup' : 'Delivery'}</div>
                <div className="text-xs text-gray-400">Pay when you receive gas</div>
              </div>
            </button>
          </div>
        </div>

        {/* Your details — no email needed */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
          <h3 className="font-bold">Your details</h3>
          <p className="text-xs text-gray-400">Phone is enough. No email signup required.</p>
          <input
            type="tel"
            inputMode="tel"
            value={buyerPhone}
            onChange={(e) => setBuyerPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-00 focus:outline-none focus:ring-2 focus:ring-orange-00"
          />
          <input
            type="text"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="Name (optional)"
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-00 focus:outline-none focus:ring-2 focus:ring-orange-00"
          />
          {deliveryType === 'delivery' && (
            <input
              type="text"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              placeholder="Delivery address"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-00 focus:outline-none focus:ring-2 focus:ring-orange-00"
            />
          )}
        </div>

        {/* Order Summary with Discount */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <h3 className="font-bold mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Original ({kg}kg × ₦{originalPrice})</span>
              <span className="line-through">₦{(originalPrice * kg).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-green-400">
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> OGas Discount</span>
              <span>-₦{totalDiscount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{kg}kg × ₦{discountedPrice}</span>
              <span>₦{gasCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Delivery</span>
              <span>{deliveryType === 'pickup' ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}</span>
            </div>
            <div className="border-t border-gray-800 pt-2 flex justify-between font-bold text-lg">
              <span>Total to Pay</span>
              <span className="text-orange-400">₦{totalAmount.toLocaleString()}</span>
            </div>
            <div className="text-xs text-green-400 text-right">
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
              ? 'bg-orange-00 text-black hover:bg-orange-400'
              : 'bg-gray-800 text-gray-00 cursor-not-allowed'
          }`}
        >
          {placingOrder
            ? 'Processing...'
            : paymentMethod === 'paystack'
              ? `Pay and lock in escrow — ₦${totalAmount.toLocaleString()}`
              : `Place cash order — ₦${totalAmount.toLocaleString()}`}
        </button>

        {paymentMethod === 'paystack' && (
          <p className="text-center text-xs text-gray-00 mt-2">
            OGas holds your money. The seller is paid only with your Door Code at the door — never automatically the next day.
          </p>
        )}
      </div>
    </div>
  );
}
