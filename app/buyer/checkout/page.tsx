'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { Flame, ArrowLeft, MapPin, Phone, Package, CreditCard } from 'lucide-react';
import Link from 'next/link';

// Dynamically import Paystack to avoid SSR issues
const PaystackButton = dynamic(
  () => import('react-paystack').then((mod) => mod.PaystackButton),
  { ssr: false }
);

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const sellerId = searchParams.get('sellerId') || '';
  const productId = searchParams.get('productId') || '';
  const size = searchParams.get('size') || '';
  const brand = searchParams.get('brand') || '';
  const price = parseInt(searchParams.get('price') || '0');
  const quantity = parseInt(searchParams.get('qty') || '1');
  const deliveryType = searchParams.get('type') || 'pickup';
  const deliveryFee = parseInt(searchParams.get('fee') || '0');
  
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [seller, setSeller] = useState<any>(null);

  const subtotal = price * quantity;
  const total = subtotal + (deliveryType === 'delivery' ? deliveryFee : 0);

  useEffect(() => {
    if (!sellerId) return;
    getDoc(doc(db, 'vendors', sellerId)).then((snap) => {
      if (snap.exists()) setSeller({ id: snap.id, ...snap.data() });
    });
  }, [sellerId]);

  const handleSuccess = async (reference: any) => {
    if (!user || !sellerId) return;
    
    setLoading(true);
    try {
      await setDoc(doc(db, 'orders', reference.reference), {
        buyerId: user.uid,
        buyerEmail: user.email,
        buyerPhone: phone,
        sellerId,
        sellerName: seller?.businessName || '',
        productSize: size,
        productBrand: brand,
        quantity,
        unitPrice: price,
        deliveryFee: deliveryType === 'delivery' ? deliveryFee : 0,
        totalAmount: total,
        orderType: deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? address : null,
        status: 'paid',
        paymentStatus: 'paid',
        paystackReference: reference.reference,
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp(),
      });

      const invRef = doc(db, 'vendors', sellerId, 'inventory', productId);
      const invSnap = await getDoc(invRef);
      if (invSnap.exists()) {
        const currentQty = invSnap.data().quantity || 0;
        await setDoc(invRef, { quantity: Math.max(0, currentQty - quantity) }, { merge: true });
      }

      alert('Payment successful! Your order has been placed.');
      router.push('/buyer');
    } catch (err) {
      alert('Payment received but order recording failed. Contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    alert('Payment cancelled. You can retry from your orders.');
  };

  const paystackProps = {
    email: user?.email || 'customer@ogas.com',
    amount: total * 100,
    metadata: {
      custom_fields: [
        { display_name: 'Product', variable_name: 'product', value: `${size} ${brand}` },
        { display_name: 'Quantity', variable_name: 'quantity', value: quantity.toString() },
        { display_name: 'Seller', variable_name: 'seller', value: seller?.businessName || '' },
      ],
    },
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_live_b73e1e169529e05ae4ba2272fb7f7937d226be3c',
    text: `Pay ₦${total.toLocaleString()}`,
    onSuccess: handleSuccess,
    onClose: handleClose,
  };

  const canPay = phone && (deliveryType === 'pickup' || address);

  if (!sellerId || !price) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Flame className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <p className="text-zinc-400">No product selected</p>
          <Link href="/buy" className="text-orange-400 mt-4 inline-block">Go to store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 font-bold text-lg">Checkout</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500/15 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="font-semibold">{size} Cylinder</p>
              <p className="text-zinc-400 text-sm">{brand}</p>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Qty: {quantity}</span>
            <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
          </div>
          {deliveryType === 'delivery' && (
            <div className="flex justify-between text-sm mt-2">
              <span className="text-zinc-400">Delivery</span>
              <span>₦{deliveryFee.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-zinc-800 mt-3 pt-3 flex justify-between">
            <span className="font-bold">Total</span>
            <span className="text-orange-400 font-bold text-lg">₦{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs mb-1">Sold by</p>
          <p className="font-semibold">{seller?.businessName || 'Loading...'}</p>
          <p className="text-zinc-400 text-sm mt-1">{seller?.address || ''}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Phone className="w-4 h-4 text-zinc-400" />
            Phone Number *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        {deliveryType === 'delivery' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <MapPin className="w-4 h-4 text-zinc-400" />
              Delivery Address *
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full address"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        )}

        {canPay ? (
          <div className="w-full">
            <PaystackButton
              {...paystackProps}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            />
          </div>
        ) : (
          <button
            disabled
            className="w-full bg-zinc-800 text-zinc-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <CreditCard className="w-5 h-5" />
            Enter phone{deliveryType === 'delivery' ? ' & address' : ''} to pay
          </button>
        )}

        <p className="text-center text-zinc-500 text-xs">
          Secured by Paystack. Your payment is protected.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
