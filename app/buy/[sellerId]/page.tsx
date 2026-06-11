'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { PaystackButton } from 'react-paystack';

interface Seller {
  id: string;
  name: string;
  phone: string;
  address: string;
  prices: Record<string, number>;
  deliveryFee: number;
  location?: { lat: number; lng: number };
}

export default function SellerOrderPage() {
  const { sellerId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('12.5kg');
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('delivery');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderStatus, setOrderStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!sellerId) return;
    const fetchSeller = async () => {
      const snap = await getDoc(doc(db, 'sellers', sellerId as string));
      if (snap.exists()) {
        setSeller({ id: snap.id, ...snap.data() } as Seller);
      }
      setLoading(false);
    };
    fetchSeller();
  }, [sellerId]);

  const unitPrice = seller?.prices?.[selectedSize] || 0;
  const deliveryFee = deliveryType === 'delivery' ? (seller?.deliveryFee || 500) : 0;
  const total = (unitPrice * quantity) + deliveryFee;

  const createOrder = async (paymentMethod: string, reference?: string, status: string = 'pending') => {
    if (!user || !seller) return null;
    
    const orderRef = await addDoc(collection(db, 'orders'), {
      buyerId: user.uid,
      buyerPhone: customerPhone,
      buyerAddress: deliveryType === 'delivery' ? customerAddress : 'Pickup',
      sellerId: seller.id,
      sellerName: seller.name,
      sellerPhone: seller.phone,
      items: [{ size: selectedSize, quantity, unitPrice }],
      deliveryType,
      deliveryFee,
      totalAmount: total,
      paymentMethod,
      paymentReference: reference || null,
      status: status,
      paymentStatus: status === 'paid' ? 'paid' : 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return orderRef.id;
  };

  const handleCashOrder = async () => {
    try {
      setOrderStatus('verifying');
      await createOrder('cash', undefined, 'pending_cash');
      setOrderStatus('success');
    } catch (err) {
      console.error(err);
      setOrderStatus('error');
      setErrorMsg('Failed to place cash order. Try again.');
    }
  };

  const verifyAndCreateOrder = async (reference: string) => {
    setOrderStatus('verifying');
    try {
      // First create order as pending
      const orderId = await createOrder('paystack', reference, 'pending_payment');
      if (!orderId) throw new Error('Failed to create order');

      // Verify payment with server
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, orderId }),
      });

      const data = await res.json();
      
      if (data.success) {
        setOrderStatus('success');
        setTimeout(() => {
          router.push('/orders?success=true&ref=' + reference);
        }, 2000);
      } else {
        setOrderStatus('error');
        setErrorMsg('Payment verification failed: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      setOrderStatus('error');
      setErrorMsg('Payment verification failed. Contact support.');
    }
  };

  const paystackConfig = {
    reference: `OGAS-${Date.now()}`,
    email: user?.email || customerPhone + '@ogas.ng',
    amount: total * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    metadata: {
      sellerId,
      customerPhone,
      deliveryType,
      custom_fields: [
        { display_name: 'Seller', variable_name: 'seller_name', value: seller?.name || '' },
        { display_name: 'Size', variable_name: 'gas_size', value: selectedSize },
      ],
    },
    onSuccess: (reference: any) => {
      verifyAndCreateOrder(reference.reference);
    },
    onClose: () => {
      console.log('Payment closed');
    },
  };

  if (loading) return <div className="p-8 text-white">Loading seller...</div>;
  if (!seller) return <div className="p-8 text-white">Seller not found</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-2">{seller.name}</h1>
        <p className="text-gray-400 text-sm mb-6">{seller.address}</p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Cylinder Size</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(seller.prices || {}).map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`p-3 rounded-xl text-sm font-medium border ${
                  selectedSize === size
                    ? 'bg-orange-500 border-orange-500 text-black'
                    : 'bg-gray-800 border-gray-700 text-gray-300'
                }`}
              >
                {size}
                <div className="text-xs opacity-70">₦{seller.prices[size].toLocaleString()}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Quantity</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl"
            >-</button>
            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl"
            >+</button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Delivery Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDeliveryType('delivery')}
              className={`p-3 rounded-xl text-sm font-medium border ${
                deliveryType === 'delivery'
                  ? 'bg-orange-500 border-orange-500 text-black'
                  : 'bg-gray-800 border-gray-700 text-gray-300'
              }`}
            >
              🚚 Delivery
              <div className="text-xs opacity-70">+₦{seller.deliveryFee || 500}</div>
            </button>
            <button
              onClick={() => setDeliveryType('pickup')}
              className={`p-3 rounded-xl text-sm font-medium border ${
                deliveryType === 'pickup'
                  ? 'bg-orange-500 border-orange-500 text-black'
                  : 'bg-gray-800 border-gray-700 text-gray-300'
              }`}
            >
              🏪 Pickup
              <div className="text-xs opacity-70">Free</div>
            </button>
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number *</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="08012345678"
              required
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500"
            />
          </div>
          {deliveryType === 'delivery' && (
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Address *</label>
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Enter your full address..."
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500"
              />
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-2xl p-4 mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Gas ({selectedSize} x{quantity})</span>
            <span>₦{(unitPrice * quantity).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-400">Delivery</span>
            <span>₦{deliveryFee.toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-2xl text-orange-500">₦{total.toLocaleString()}</span>
          </div>
        </div>

        {orderStatus === 'success' ? (
          <div className="bg-green-500/20 border border-green-500 rounded-2xl p-4 text-center">
            <div className="text-green-400 font-bold text-lg mb-1">✅ Order Placed!</div>
            <p className="text-green-300 text-sm">The seller will contact you shortly.</p>
          </div>
        ) : orderStatus === 'verifying' ? (
          <div className="bg-orange-500/20 border border-orange-500 rounded-2xl p-4 text-center">
            <div className="text-orange-400 font-bold text-lg mb-1">⏳ Verifying Payment...</div>
            <p className="text-orange-300 text-sm">Please wait while we confirm your payment.</p>
          </div>
        ) : orderStatus === 'error' ? (
          <div className="bg-red-500/20 border border-red-500 rounded-2xl p-4 text-center">
            <div className="text-red-400 font-bold text-lg mb-1">❌ Payment Failed</div>
            <p className="text-red-300 text-sm">{errorMsg}</p>
            <button 
              onClick={() => setOrderStatus('idle')}
              className="mt-3 px-4 py-2 bg-gray-800 rounded-lg text-sm"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <PaystackButton
              {...paystackConfig}
              className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl transition-colors"
              text={`Pay ₦${total.toLocaleString()} with Paystack`}
            />
            <button
              onClick={handleCashOrder}
              className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl border border-gray-700 transition-colors"
            >
              Pay Cash on Delivery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
