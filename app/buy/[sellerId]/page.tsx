'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Seller {
  id: string;
  businessName: string;
  phone: string;
  address: string;
  gasSizes: string[];
  prices: Record<string, number>;
  deliveryFee: number;
}

export default function OrderPage() {
  const params = useParams();
  const sellerId = params?.sellerId as string;
  
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [payMethod, setPayMethod] = useState<'paystack' | 'cash'>('paystack');
  const [error, setError] = useState('');

  useEffect(() => {
    if (sellerId) loadSeller();
  }, [sellerId]);

  const loadSeller = async () => {
    try {
      const ref = doc(db, 'vendors', sellerId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSeller({ id: snap.id, ...snap.data() } as Seller);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!name || !phone || !selectedSize) {
      setError('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const unitPrice = seller?.prices?.[selectedSize] || 0;
      const deliveryFee = payMethod === 'delivery' ? (seller?.deliveryFee || 0) : 0;
      const total = (unitPrice * quantity) + deliveryFee;

      // Create order in Firestore
      const orderRef = await addDoc(collection(db, 'orders'), {
        buyerName: name,
        buyerPhone: phone,
        buyerAddress: address,
        sellerId: sellerId,
        sellerName: seller?.businessName,
        sellerPhone: seller?.phone,
        gasSize: selectedSize,
        quantity: quantity,
        unitPrice: unitPrice,
        deliveryFee: deliveryFee,
        totalAmount: total,
        paymentMethod: payMethod,
        status: payMethod === 'paystack' ? 'pending_payment' : 'pending',
        paymentStatus: payMethod === 'paystack' ? 'unpaid' : 'cash_on_delivery',
        createdAt: serverTimestamp(),
      });

      if (payMethod === 'paystack') {
        // Initialize Paystack
        const res = await fetch('/api/checkout/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `${phone}@ogas.user`,
            amount: total,
            orderId: orderRef.id,
            name: name,
          }),
        });

        const data = await res.json();
        if (data.success && data.authorization_url) {
          window.location.href = data.authorization_url;
        } else {
          setError('Payment initialization failed. Try again.');
        }
      } else {
        // Cash order — redirect to WhatsApp
        const message = `Hello ${seller?.businessName}, I want to order ${quantity}x ${selectedSize}kg gas. Name: ${name}, Phone: ${phone}, Address: ${address}. Total: ₦${total.toLocaleString()}`;
        const whatsappUrl = `https://wa.me/234${seller?.phone?.replace(/^0/, '')}?text=${encodeURIComponent(message)}`;
        window.location.href = whatsappUrl;
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <p>Seller not found</p>
      </div>
    );
  }

  const unitPrice = seller.prices?.[selectedSize] || 0;
  const deliveryFee = payMethod === 'delivery' ? (seller?.deliveryFee || 0) : 0;
  const total = (unitPrice * quantity) + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="sticky top-0 z-50 bg-gray-900/95 border-b border-gray-800 backdrop-blur">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center">
          <a href="/buy/" className="text-gray-400 hover:text-white">← Back</a>
          <h1 className="font-bold text-lg ml-4">Place Order</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Seller Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h2 className="font-bold text-lg">{seller.businessName}</h2>
          <p className="text-sm text-gray-400">📍 {seller.address}</p>
          <p className="text-sm text-gray-400">📞 {seller.phone}</p>
        </div>

        {/* Gas Size Selection */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h3 className="font-semibold mb-3">Select Gas Size</h3>
          <div className="grid grid-cols-2 gap-2">
            {seller.gasSizes?.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-3 rounded-xl border font-semibold text-sm transition-all ${
                  selectedSize === size
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-300'
                }`}
              >
                {size}kg — ₦{(seller.prices?.[size] || 0).toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        {selectedSize && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold mb-3">Quantity</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 bg-gray-700 rounded-full text-xl font-bold"
              >-</button>
              <span className="text-2xl font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 bg-gray-700 rounded-full text-xl font-bold"
              >+</button>
            </div>
          </div>
        )}

        {/* Your Details */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold">Your Details</h3>
          <input
            type="text"
            placeholder="Your full name *"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400"
          />
          <input
            type="tel"
            placeholder="Phone number * (e.g. 09133110237)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="Delivery address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400"
          />
        </div>

        {/* Payment Method */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h3 className="font-semibold mb-3">Payment Method</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPayMethod('paystack')}
              className={`py-3 rounded-xl border font-semibold text-sm transition-all ${
                payMethod === 'paystack'
                  ? 'bg-green-700 border-green-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300'
              }`}
            >
              💳 Pay Online
            </button>
            <button
              onClick={() => setPayMethod('cash')}
              className={`py-3 rounded-xl border font-semibold text-sm transition-all ${
                payMethod === 'cash'
                  ? 'bg-green-700 border-green-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300'
              }`}
            >
              💵 Cash on Delivery
            </button>
          </div>
        </div>

        {/* Total & Pay */}
        {selectedSize && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Subtotal</span>
              <span>₦{(unitPrice * quantity).toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Delivery</span>
              <span className="text-green-400">{deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-orange-400">₦{total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleOrder}
          disabled={submitting || !selectedSize || !name || !phone}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-black py-4 rounded-2xl text-lg disabled:opacity-50"
        >
          {submitting ? 'Processing...' : payMethod === 'paystack' ? `Pay ₦${total.toLocaleString()} →` : 'Place Order →'}
        </button>
      </div>
    </div>
  );
}
