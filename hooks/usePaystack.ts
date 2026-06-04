"use client";

import { useState, useCallback } from 'react';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  ref: string;
  callback: (response: { reference: string; status: string; trans: string }) => void;
  onClose: () => void;
  metadata?: any;
  subaccount?: string;
  bearer?: string;
  transaction_charge?: number;
}

export function usePaystack() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPaystack = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.PaystackPop) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const initializePayment = useCallback(async (params: {
    email: string;
    amount: number;
    reference: string;
    sellerSubaccount?: string;
    sellerAmount?: number;
    metadata?: any;
    onSuccess: (ref: string) => void;
    onCancel?: () => void;
  }): Promise<void> => {
    setLoading(true);
    setError(null);

    const loaded = await loadPaystack();
    if (!loaded) {
      setError('Failed to load Paystack. Please try again.');
      setLoading(false);
      return;
    }

    const config: PaystackConfig = {
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_your_key_here',
      email: params.email,
      amount: Math.round(params.amount * 100),
      ref: params.reference,
      metadata: {
        ...params.metadata,
        custom_fields: [
          { display_name: "Platform", variable_name: "platform", value: "OGas Marketplace" },
          { display_name: "Seller Subaccount", variable_name: "seller_subaccount", value: params.sellerSubaccount || "none" }
        ]
      },
      callback: (response) => {
        setLoading(false);
        if (response.status === 'success') {
          params.onSuccess(response.reference);
        } else {
          setError('Payment was not successful');
        }
      },
      onClose: () => {
        setLoading(false);
        params.onCancel?.();
      },
    };

    if (params.sellerSubaccount && params.sellerAmount && params.sellerAmount > 0) {
      config.subaccount = params.sellerSubaccount;
      config.bearer = "subaccount";
      config.transaction_charge = Math.round((params.amount - params.sellerAmount) * 100);
    }

    try {
      const handler = window.PaystackPop.setup(config);
      handler.openIframe();
    } catch (err: any) {
      setError(err.message || 'Payment initialization failed');
      setLoading(false);
    }
  }, [loadPaystack]);

  const generateRef = useCallback((orderId: string): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `OGAS_${orderId}_${timestamp}_${random}`;
  }, []);

  return {
    initializePayment,
    generateRef,
    loading,
    error,
  };
}

export default usePaystack;
