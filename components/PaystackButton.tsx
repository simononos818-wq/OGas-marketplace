'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  amount: number;
  email?: string;
  onSuccess?: (ref: string) => void;
  onClose?: () => void;
  metadata?: Record<string, any>;
  text?: string;
  className?: string;
  sellerId?: string;
  orderId?: string;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function PaystackButton({ 
  amount, 
  email: propEmail, 
  onSuccess, 
  onClose, 
  metadata = {}, 
  text = 'Pay Now', 
  className = '',
  sellerId,
  orderId
}: Props) {
  const auth = useAuth(); 
  const user = auth?.user;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const email = propEmail || user?.email || '';
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

  const handlePayment = () => {
    setError(null);
    
    if (!email) {
      setError('Please login first');
      alert('Please login to make payment');
      return;
    }
    
    if (!publicKey) {
      setError('Paystack key not configured');
      alert('Payment not configured. Please contact support.');
      return;
    }

    if (typeof window === 'undefined' || !window.PaystackPop) {
      setError('Paystack not loaded');
      alert('Payment system loading... Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    
    try {
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email,
        amount: Math.round(amount * 100),
        currency: 'NGN',
        ref: `OGAS_${orderId || Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        metadata: {
          custom_fields: [
            { display_name: "User ID", variable_name: "user_id", value: user?.uid || 'guest' },
            { display_name: "Order ID", variable_name: "order_id", value: orderId || 'N/A' },
            { display_name: "Seller ID", variable_name: "seller_id", value: sellerId || 'N/A' },
            ...Object.entries(metadata).map(([key, value]) => ({ 
              display_name: key, 
              variable_name: key, 
              value: String(value) 
            }))
          ]
        },
        callback: (response: any) => {
          setIsLoading(false);
          console.log('Paystack success:', response);
          onSuccess?.(response.reference);
        },
        onClose: () => {
          setIsLoading(false);
          console.log('Paystack closed');
          onClose?.();
        }
      });
      
      handler.openIframe();
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Payment failed');
      console.error('Paystack error:', err);
      alert('Payment failed: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      <button 
        onClick={handlePayment} 
        disabled={isLoading || !email} 
        className={`w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-colors ${className}`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          text
        )}
      </button>
    </div>
  );
}
