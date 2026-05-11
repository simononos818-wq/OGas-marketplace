'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { verifyPayment, PAYSTACK_PUBLIC_KEY } from '@/app/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function usePaystackScript() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).PaystackPop) {
      setLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setLoaded(false);
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);
  return loaded;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [message, setMessage] = useState('');
  const [orderDetails, setOrderDetails] = useState({
    amount: 10000,
    email: '',
    phone: '',
    item: 'LPG Gas Cylinder',
  });
  const paystackLoaded = usePaystackScript();

  useEffect(() => {
    if (reference) {
      setStatus('verifying');
      setMessage('Verifying your payment...');
      verifyPayment(reference)
        .then((data) => {
          if (data.data?.status === 'success') {
            setStatus('success');
            setMessage('Payment successful! Your order has been confirmed.');
          } else {
            setStatus('failed');
            setMessage('Payment verification failed. Please contact support.');
          }
        })
        .catch((err) => {
          setStatus('failed');
          setMessage('Error verifying payment: ' + err.message);
        });
    }
  }, [reference]);

  const handlePay = () => {
    if (!paystackLoaded || !(window as any).PaystackPop) {
      alert('Paystack is still loading. Please wait a moment and try again.');
      return;
    }

    const email = orderDetails.email || auth?.user?.email || 'customer@ogasmarketplace.com';
    const ref = 'OGAS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: orderDetails.amount,
      currency: 'NGN',
      ref: ref,
      metadata: {
        custom_fields: [
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: auth?.user?.displayName || 'Guest',
          },
          {
            display_name: 'Item',
            variable_name: 'item',
            value: orderDetails.item,
          },
        ],
      },
      callback: function (response: any) {
        window.location.href = '/buyer/checkout/?reference=' + response.reference;
      },
      onClose: function () {
        setMessage('Payment window was closed. You can try again.');
      },
    });
    handler.openIframe();
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1a] rounded-2xl p-8 border border-green-500/30 text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-6">Reference: {reference}</p>
            <button
              onClick={() => router.push('/buy')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition"
            >
              Continue Shopping
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1a] rounded-2xl p-8 border border-red-500/30 text-center"
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition"
            >
              Try Again
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">{message}</p>
          <p className="text-gray-500 text-sm mt-2">Reference: {reference}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] rounded-2xl p-8 border border-orange-500/20"
        >
          <div className="text-center mb-8">
            <ShoppingCart className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Checkout</h1>
            <p className="text-gray-400 mt-2">Complete your LPG purchase</p>
          </div>

          <div className="space-y-6">
            <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Item</span>
                <span className="text-white font-medium">{orderDetails.item}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount</span>
                <span className="text-orange-500 font-bold">₦{(orderDetails.amount / 100).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Email</label>
              <input
                type="email"
                value={orderDetails.email}
                onChange={(e) => setOrderDetails({...orderDetails, email: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Phone Number</label>
              <input
                type="tel"
                value={orderDetails.phone}
                onChange={(e) => setOrderDetails({...orderDetails, phone: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none"
                placeholder="08012345678"
              />
            </div>

            <button
              onClick={handlePay}
              disabled={!paystackLoaded}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {!paystackLoaded ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Loading Paystack...</>
              ) : (
                <>Pay ₦{(orderDetails.amount / 100).toFixed(2)} <ShoppingCart className="w-5 h-5" /></>
              )}
            </button>

            {message && (
              <p className="text-center text-gray-400 text-sm">{message}</p>
            )}

            <div className="text-center">
              <p className="text-xs text-gray-600">
                Secured by Paystack. Your payment is protected.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
