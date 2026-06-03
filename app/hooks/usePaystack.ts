'use client';

import { useState } from 'react';

export function usePaystack() {
  const [loading, setLoading] = useState(false);

  const initializePayment = async (
    email: string,
    amount: number,
    metadata: any = {}
  ): Promise<{ reference: string; authorization_url: string } | null> => {
    setLoading(true);
    try {
      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // kobo
          metadata,
          callback_url: typeof window !== 'undefined' ? `${window.location.origin}/orders` : '',
        }),
      });

      const data = await response.json();
      if (data.status) {
        return {
          reference: data.data.reference,
          authorization_url: data.data.authorization_url,
        };
      }
      return null;
    } catch (err) {
      console.error('Paystack error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (reference: string): Promise<boolean> => {
    try {
      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${publicKey}`,
        },
      });
      const data = await response.json();
      return data.status && data.data.status === 'success';
    } catch (err) {
      return false;
    }
  };

  return { initializePayment, verifyPayment, loading };
}
