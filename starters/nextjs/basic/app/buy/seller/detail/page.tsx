"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, Timestamp, updateDoc } from 'firebase/firestore';
import { usePaystack } from '@/hooks/usePaystack';
import { calculateBreakdown, formatPrice, CYLINDER_SIZES } from '@/lib/gasCalculator';
import { ChevronLeft, MapPin, Star, Truck, Phone, Flame, Minus, Plus, CheckCircle, AlertCircle, Banknote } from 'lucide-react';

interface Seller {
  id: string;
  name: string;
  phone: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  pricePerKg: number;
  availableSizes: number[];
  deliveryAvailable: boolean;
  deliveryFee: number;
  rating: number;
  isVerified: boolean;
  description?: string;
  paystackSubaccountCode?: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
}

function SellerDetailContent() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get('id');
  
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(12.5);
  const [quantity, setQuantity] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  const { initializePayment, generateRef, loading: paystackLoading } = usePaystack();

  useEffect(() => {
    const saved = localStorage.getItem('ogas_buyer_info');
    if (saved) {
      try {
        const info = JSON.parse(saved);
        setBuyerName(info.name || '');
        setBuyerPhone(info.phone || '');
        setBuyerEmail(info.email || '');
        setDeliveryAddress(info.address || '');
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!sellerId) return;
    const fetchSeller = async () => {
      try {
        const snap = await getDoc(doc(db, 'sellers', sellerId));
        if (snap.exists()) {
          setSeller({ id: snap.id, ...snap.data() } as Seller);
        }
      } catch (err) {
        console.error('Failed to fetch seller:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSeller();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-orange-500">Loading seller...</div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <Flame className="w-16 h-16 text-gray-700 mb-4" />
        <p className="text-gray-400 text-sm mb-4">Seller not found</p>
        <Link href="/buy" className="text-orange-400 text-sm">← Back to sellers</Link>
      </div>
    );
  }

  const breakdown = calculateBreakdown(
    selectedSize * quantity,
    seller.pricePerKg,
    deliveryOption === 'delivery' ? (seller.deliveryFee || 0) : 0
  );

  const handlePlaceOrder = async () => {
    if (!buyerName || !buyerPhone || (deliveryOption === 'delivery' && !deliveryAddress)) {
      alert('Please fill in all required fields');
      return;
    }

    setPlacingOrder(true);

    try {
      localStorage.setItem('ogas_buyer_info', JSON.stringify({
        name: buyerName, phone: buyerPhone, email: buyerEmail, address: deliveryAddress,
      }));

      const orderData = {
        buyerId: buyerPhone,
        buyerName,
        buyerPhone,
        buyerEmail: buyerEmail || '',
        sellerId: seller.id,
        sellerName: seller.businessName || seller.name,
        sellerPhone: seller.phone,
        items: [{ kg: selectedSize, litres: breakdown.litres, pricePerKg: seller.pricePerKg, quantity }],
        deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress : 'Pickup at seller location',
        deliveryFee: breakdown.deliveryFee,
        subtotal: breakdown.subtotal,
        platformFee: breakdown.platformFee,
        sellerAmount: breakdown.sellerAmount,
        total: breakdown.total,
        status: 'pending_payment',
        paymentStatus: 'pending',
        paymentMethod: 'paystack',
        deliveryOption,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        sellerSubaccount: seller.paystackSubaccountCode || null,
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(docRef.id);

      const ref = generateRef(docRef.id);
      
      await initializePayment({
        email: buyerEmail || `${buyerPhone}@ogas.app`,
        amount: breakdown.total,
        reference: ref,
        sellerSubaccount: seller.paystackSubaccountCode,
        sellerAmount: breakdown.sellerAmount + breakdown.deliveryFee,
        metadata: { orderId: docRef.id, sellerId: seller.id, buyerPhone, items: `${selectedSize}kg x ${quantity}` },
        onSuccess: async (paymentRef) => {
          await updateDoc(doc(db, 'orders', docRef.id), {
            paymentStatus: 'paid', status: 'pending', paystackRef: paymentRef, updatedAt: Timestamp.now(),
          });
          setOrderSuccess(true);
        },
        onCancel: () => { setPlacingOrder(false); },
      });

    } catch (err: any) {
      alert('Error: ' + err.message);
      setPlacingOrder(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
        <p className="text-gray-400 text-sm mb-2">Order #{orderId.slice(-6).toUpperCase()}</p>
        <p className="text-gray-500 text-xs mb-6">
          Your order is placed. The seller will confirm and prepare your gas.<br /><br />
          <span className="text-orange-400">Important:</span> You must confirm delivery before the seller gets paid.
        </p>
        <Link href="/orders" className="w-full max-w-md bg-orange-500 text-white rounded-xl py-4 font-semibold">
          Track My Order
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="bg-gradient-to-b from-orange-900/20 to-black px-4 pt-6 pb-4">
        <Link href="/buy" className="flex items-center gap-2 text-gray-400 mb-4">
          <ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span>
        </Link>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center shrink-0">
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{seller.businessName || seller.name}</h1>
            <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />{seller.address || `${seller.city}, ${seller.state}`}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-gold"><Star className="w-3 h-3 fill-gold" />{seller.rating || '4.5'}</span>
              {seller.isVerified && <span className="text-xs text-blue-400">✓ Verified</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div><p className="text-gray-500 text-xs">Price per kg</p><p className="text-2xl font-bold text-orange-400">{formatPrice(seller.pricePerKg)}</p></div>
          <div className="text-right"><p className="text-gray-500 text-xs">Available sizes</p><p className="text-white text-sm">{seller.availableSizes?.join(', ')}kg</p></div>
        </div>

        <p className="text-gray-500 text-xs mb-2">Select cylinder size</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {CYLINDER_SIZES.filter(s => seller.availableSizes?.includes(s.kg)).map((size) => (
            <button key={size.kg} onClick={() => setSelectedSize(size.kg)}
              className={`p-3 rounded-xl border text-center transition-all ${selectedSize === size.kg ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-dark-card border-dark-border text-gray-400'}`}>
              <p className="font-bold text-sm">{size.kg}kg</p><p className="text-xs text-gray-500">{size.litres}L</p>
            </button>
          ))}
        </div>

        <p className="text-gray-500 text-xs mb-2">Quantity</p>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center text-white"><Minus className="w-4 h-4" /></button>
          <span className="text-white font-bold text-xl w-8 text-center">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center text-white"><Plus className="w-4 h-4" /></button>
        </div>

        {seller.deliveryAvailable && (
          <div className="mb-4">
            <p className="text-gray-500 text-xs mb-2">Delivery option</p>
            <div className="flex gap-2">
              <button onClick={() => setDeliveryOption('delivery')} className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${deliveryOption === 'delivery' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-dark-card border-dark-border text-gray-400'}`}><Truck className="w-4 h-4 mx-auto mb-1" />Delivery (+{formatPrice(seller.deliveryFee || 0)})</button>
              <button onClick={() => setDeliveryOption('pickup')} className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${deliveryOption === 'pickup' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-dark-card border-dark-border text-gray-400'}`}><MapPin className="w-4 h-4 mx-auto mb-1" />Pickup (Free)</button>
            </div>
          </div>
        )}

        <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-3">Price Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">{selectedSize}kg x {quantity} @ {formatPrice(seller.pricePerKg)}/kg</span><span className="text-white">{formatPrice(breakdown.subtotal)}</span></div>
            {breakdown.deliveryFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Delivery fee</span><span className="text-white">{formatPrice(breakdown.deliveryFee)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-400">OGas platform fee (10%)</span><span className="text-orange-400">{formatPrice(breakdown.platformFee)}</span></div>
            <div className="border-t border-dark-border pt-2 flex justify-between"><span className="text-white font-semibold">Total to pay</span><span className="text-orange-400 font-bold text-lg">{formatPrice(breakdown.total)}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-dark-border">
            <p className="text-gray-500 text-xs flex items-center gap-1">
              <Banknote className="w-3 h-3" />
              Seller receives: <span className="text-green-400 font-medium">{formatPrice(breakdown.sellerAmount + breakdown.deliveryFee)}</span>
              {seller.paystackSubaccountCode ? <span className="text-green-400"> (instant payout)</span> : <span className="text-yellow-400"> (after you confirm delivery)</span>}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <h3 className="text-white font-semibold text-sm">Your Details</h3>
          <input type="text" placeholder="Your full name *" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500" />
          <input type="tel" placeholder="Phone number *" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500" />
          <input type="email" placeholder="Email (for receipt)" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500" />
          {deliveryOption === 'delivery' && (
            <textarea placeholder="Delivery address *" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} rows={2} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 resize-none" />
          )}
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-3 mb-4">
          <p className="text-gray-500 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <span><span className="text-orange-400 font-medium">Escrow Protection:</span> Your payment is held securely. The seller only receives funds after you confirm delivery. OGas charges 10% per transaction for platform services.</span>
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 p-4 z-50">
        <div className="max-w-md mx-auto">
          <button onClick={handlePlaceOrder} disabled={placingOrder || paystackLoading} className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-orange-500/20 disabled:opacity-50 active:scale-[0.98] transition-transform">
            {placingOrder || paystackLoading ? 'Processing...' : `Pay ${formatPrice(breakdown.total)} • Place Order`}
          </button>
          <p className="text-center text-gray-600 text-xs mt-2">Secured by Paystack • OGas fee: {formatPrice(breakdown.platformFee)}</p>
        </div>
      </div>
    </div>
  );
}

export default function SellerDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-pulse text-orange-500">Loading...</div></div>}>
      <SellerDetailContent />
    </Suspense>
  );
}
