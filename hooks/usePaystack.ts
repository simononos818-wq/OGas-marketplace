'use client';

import { useState } from 'react';

interface PaymentData {
  email: string;
  amount: number;
  reference: string;
  metadata?: any;
}

export const usePaystack = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializePayment = async (paymentData: PaymentData, onSuccess: (ref: string) => void) => {
    setLoading(true);
    setError(null);

    try {
      const PaystackPop = (await import('@paystack/inline-js')).default;
      
      const handler = PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: paymentData.email,
        amount: paymentData.amount,
        ref: paymentData.reference,
        metadata: paymentData.metadata,
        onClose: () => {
          setLoading(false);
        },
        callback: (response: any) => {
          setLoading(false);
          onSuccess(response.reference);
        }
      });

      handler.openIframe();
    } catch (err) {
      setError('Payment initialization failed');
      setLoading(false);
    }
  };

  return { initializePayment, loading, error };
};
