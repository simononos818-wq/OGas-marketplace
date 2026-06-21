'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { Flame, MapPin, Star, Phone, Truck, ChevronLeft, Minus, Plus } from 'lucide-react';
import Link from 'next/link';

interface Seller {
  id: string;
  businessName: string;
  phone: string;
  address: string;
  prices: Record<string, number>;
  deliveryFee: number;
  location?: { lat: number; lng: number };
}

const loadPaystackScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).PaystackPop) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.body.appendChild(script);
  });
};

export default function SellerOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sellerId = params.sellerId as string;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderStatus, setOrderStatus] = useState<'idle' | 'creating' | 'paying' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  useEffect(() => {
    loadPaystackScript()
      .then(() => setPaystackLoaded(true))
      .catch(err => {
        console.error('Paystack load error:', err);
        setErrorMsg('Payment system unavailable. Please refresh.');
      });
  }, []);

  useEffect(() => {
    loadSeller();
  }, [sellerId]);

  const loadSeller = async () => {
    try {
      const docRef = doc(db, 'sellers', sellerId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const prices = data.prices || {};
        const sizes = Object.keys(prices).sort((a, b) => parseFloat(a) - parseFloat(b));
        
        setSeller({
          id: docSnap.id,
          businessName: data.businessName || 'Unknown',
          phone: data.phone || '',
          address: data.address || '',
          prices: prices,
          deliveryFee: data.deliveryFee || 500,
          location: data.location,
        } as Seller);
        
        if (sizes.length > 0) {
          setSelectedSize(sizes[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const unitPrice = selectedSize && seller?.prices?.[selectedSize] ? seller.prices[selectedSize] : 0;
  const deliveryFee = deliveryType === 'delivery' ? (seller?.deliveryFee || 500) : 0;
  const subtotal = unitPrice * quantity;
  const total = subtotal + deliveryFee;

  const createOrder = async (paymentMethod: string, reference?: string, status: string = 'pending') => {
    if (!user || !seller || !selectedSize) return null;
    
    const orderRef = await addDoc(collection(db, 'orders'), {
      buyerId: user.uid,
      buyerPhone: customerPhone,
      buyerAddress: customerAddress,
      buyerEmail: user.email,
      sellerId: seller.id,
      sellerName: seller.businessName,
      sellerPhone: seller.phone,
      items: [{ size: selectedSize, quantity, price: unitPrice }],
      deliveryType,
      deliveryFee,
      totalAmount: total,
      paymentMethod,
      paystackRef: reference || null,
      status,
      paymentStatus: status === 'paid' ? 'paid' : 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return orderRef.id;
  };

  const handlePaystackSuccess = useCallback(async (reference: string) => {
    setOrderStatus('verifying');
    try {
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });

      const data = await res.json();
      
      if (data.success) {
        setOrderStatus('success');
        setTimeout(() => router.push('/orders'), 2000);
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (err: any) {
      console.error(err);
      setOrderStatus('error');
      setErrorMsg(err.message || 'Payment verification failed');
    }
  }, [router]);

  const handlePlaceOrder = async () => {
    if (!paystackLoaded) {
      setErrorMsg('Payment system still loading. Please wait and try again.');
      return;
    }
    
    if (!selectedSize) {
      setErrorMsg('Please select a cylinder size');
      return;
    }
    
    if (!customerPhone) {
      setErrorMsg('Please enter your phone number');
      return;
    }
    if (deliveryType === 'delivery' && !customerAddress) {
      setErrorMsg('Please enter delivery address');
      return;
    }

    setOrderStatus('creating');
    setErrorMsg('');

    try {
      const orderId = await createOrder('paystack', undefined, 'pending_payment');
      if (!orderId) throw new Error('Failed to create order');

      setOrderStatus('paying');
      
      const paystack = (window as any).PaystackPop;
      if (!paystack) {
        throw new Error('Paystack not loaded. Please refresh the page.');
      }
      
      const handler = paystack.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_live_b73e1e169529e05ae4ba2272fb7f7937d226be3c',
        email: user?.email || customerPhone + '@ogas.ng',
        amount: total * 100,
        ref: `OGAS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          orderId: orderId,
          sellerId: sellerId,
          customerPhone: customerPhone,
          custom_fields: [
            { display_name: 'Order ID', variable_name: 'order_id', value: orderId },
            { display_name: 'Seller', variable_name: 'seller_name', value: seller?.businessName || '' },
            { display_name: 'Size', variable_name: 'cylinder_size', value: selectedSize },
          ]
        },
        callback: function(response: any) {
          handlePaystackSuccess(response.reference);
        },
        onClose: function() {
          setOrderStatus('idle');
        }
      });
      
      handler.openIframe();
    } catch (err: any) {
      console.error(err);
      setOrderStatus('error');
      setErrorMsg(err.message || 'Failed to place order');
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-orange-500">Loading...</div>;
  if (!seller) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">Seller not found</div>;

  const sizes = Object.keys(seller.prices || {}).sort((a, b) => parseFloat(a) - parseFloat(b));

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="sticky top-0 bg-black/95 backdrop-blur-lg border-b border-gray-800 z-40 px-4 py-3 flex items-center gap-3">
        <Link href="/buy" className="p-2 -ml-2 hover:bg-gray-900 rounded-lg transition">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold truncate">{seller.businessName}</h1>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin size={10} /> {seller.address}
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Flame size={24} className="text-orange-500" />
            </div>
            <div>
              <h2 className="font-bold">{seller.businessName}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Star size={12} className="text-yellow-500" fill="currentColor" /> 5.0
                <span>•</span>
                <Phone size={12} /> {seller.phone}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 rounded-lg p-2">
            <Truck size={14} className="text-orange-500" />
            Delivery: N{seller.deliveryFee} • Pickup available
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h3 className="font-bold mb-3">Select Cylinder Size</h3>
          {sizes.length === 0 ? (
            <p className="text-gray-500 text-sm">No prices available for this seller.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`p-3 rounded-xl text-sm font-medium transition ${
                    selectedSize === size 
                      ? 'bg-orange-500 text-black' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <div className="text-lg font-bold">{size}</div>
                  <div className="text-xs opacity-70">N{seller.prices[size].toLocaleString()}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h3 className="font-bold mb-3">Quantity</h3>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition"
            >
              <Minus size={20} />
            </button>
            <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h3 className="font-bold mb-3">Delivery Option</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDeliveryType('delivery')}
              className={`p-3 rounded-xl text-sm font-medium transition ${
                deliveryType === 'delivery' 
                  ? 'bg-orange-500 text-black' 
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              <Truck size={18} className="mx-auto mb-1" />
              Home Delivery
              <div className="text-xs opacity-70">+N{seller.deliveryFee}</div>
            </button>
            <button
              onClick={() => setDeliveryType('pickup')}
              className={`p-3 rounded-xl text-sm font-medium transition ${
                deliveryType === 'pickup' 
                  ? 'bg-orange-500 text-black' 
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              <MapPin size={18} className="mx-auto mb-1" />
              Pickup
              <div className="text-xs opacity-70">Free</div>
            </button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          <h3 className="font-bold">Your Details</h3>
          <input
            type="tel"
            placeholder="Phone number (e.g. 08012345678)"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
          {deliveryType === 'delivery' && (
            <input
              placeholder="Delivery address"
              value={customerAddress}
              onChange={e => setCustomerAddress(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          )}
        </div>

        {errorMsg && (
          <div className="bg-red-900/30 border border-red-500 rounded-xl p-3 text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <div className="bg-gradient-to-b from-orange-900/20 to-gray-900 border border-orange-500/30 rounded-2xl p-4">
          <h3 className="font-bold mb-3 text-orange-400">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">{selectedSize || 'Select size'} x {quantity}</span>
              <span>N{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Delivery</span>
              <span>{deliveryType === 'delivery' ? `N${deliveryFee.toLocaleString()}` : 'Free'}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-orange-500">N{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {orderStatus === 'success' ? (
          <div className="bg-green-900/30 border border-green-500 rounded-2xl p-4 text-center">
            <div className="text-green-500 font-bold text-lg mb-1">Order Placed!</div>
            <p className="text-green-400 text-sm">Redirecting to orders...</p>
          </div>
        ) : (
          <button
            onClick={handlePlaceOrder}
            disabled={orderStatus === 'creating' || orderStatus === 'paying' || orderStatus === 'verifying' || !paystackLoaded}
            className="w-full bg-orange-500 text-black font-bold py-4 rounded-2xl hover:bg-orange-400 transition disabled:opacity-50 text-lg"
          >
            {!paystackLoaded ? 'Loading Payment...' :
             orderStatus === 'creating' ? 'Creating Order...' : 
             orderStatus === 'paying' ? 'Opening Paystack...' : 
             orderStatus === 'verifying' ? 'Verifying...' : 
             `Pay N${total.toLocaleString()}`}
          </button>
        )}
      </div>
    </div>
  );
}
