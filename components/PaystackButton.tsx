'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  amount: number;
  email?: string;
  onSuccess?: (ref: string) => void;
  onClose?: () => void;
  metadata?: Record<string, any>;
  text?: string;
  className?: string;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function PaystackButton({ amount, email: propEmail, onSuccess, onClose, metadata = {}, text = 'Pay Now', className = '' }: Props) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const email = propEmail || user?.email || '';
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

  const handlePayment = () => {
    if (!email || !publicKey) {
      alert('Payment configuration error');
      return;
    }
    setIsLoading(true);
    const handler = window.PaystackPop.setup({
      key: publicKey,
      email,
      amount: amount * 100,
      ref: 'OGAS_' + Math.floor(Math.random() * 1000000000),
      metadata: { custom_fields: [{ display_name: "User ID", variable_name: "user_id", value: user?.uid || 'guest' }, ...Object.entries(metadata).map(([key, value]) => ({ display_name: key, variable_name: key, value: String(value) }))] },
      callback: (response: any) => { setIsLoading(false); onSuccess?.(response.reference); },
      onClose: () => { setIsLoading(false); onClose?.(); }
    });
    handler.openIframe();
  };

  return (
    <button onClick={handlePayment} disabled={isLoading || !email} className={`w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors ${className}`}>
      {isLoading ? 'Processing...' : text}
    </button>
  );
}
