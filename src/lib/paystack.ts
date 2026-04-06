"use client";

import { useState, useCallback } from "react";
import PaystackPop from "@paystack/inline-js";
import { OrderService } from "@/lib/firebase";

interface PaystackConfig {
  email: string;
  amount: number;
  reference: string;
  metadata?: Record<string, unknown>;
  onSuccess?: (reference: string) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
}

export function usePaystack() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initializePayment = useCallback(async ({
    email,
    amount,
    reference,
    metadata = {},
    onSuccess,
    onCancel,
    onError
  }: PaystackConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const paystack = new PaystackPop();
      
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
        email,
        amount,
        reference,
        metadata: {
          ...metadata,
          custom_fields: [
            {
              display_name: "Platform",
              variable_name: "platform",
              value: "OGas Marketplace"
            }
          ]
        },
        onSuccess: (transaction: { reference: string; status: string }) => {
          setIsLoading(false);
          console.log("Payment successful:", transaction);
          onSuccess?.(transaction.reference);
        },
        onCancel: () => {
          setIsLoading(false);
          console.log("Payment cancelled");
          onCancel?.();
        },
        onLoad: (response: unknown) => {
          console.log("Paystack loaded:", response);
        },
        onError: (error: Error) => {
          setIsLoading(false);
          setError(error);
          console.error("Payment error:", error);
          onError?.(error);
        }
      });
    } catch (err) {
      setIsLoading(false);
      const error = err instanceof Error ? err : new Error("Payment initialization failed");
      setError(error);
      onError?.(error);
    }
  }, []);

  return {
    initializePayment,
    isLoading,
    error
  };
}

export function calculateTotal(subtotal: number, deliveryFee: number = 500): {
  subtotal: number;
  deliveryFee: number;
  total: number;
  paystackAmount: number;
} {
  const total = subtotal + deliveryFee;
  return {
    subtotal,
    deliveryFee,
    total,
    paystackAmount: Math.round(total * 100)
  };
}

export function generatePaymentReference(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `OGAS_${timestamp}_${random}`;
}

export async function processCheckout(
  orderId: string,
  email: string,
  amount: number,
  onSuccess: (reference: string) => void,
  onError: (error: Error) => void
) {
  const reference = generatePaymentReference();
  
  const paystack = new PaystackPop();
  
  paystack.newTransaction({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    email,
    amount: amount * 100,
    reference,
    metadata: {
      order_id: orderId,
      custom_fields: [
        {
          display_name: "Order ID",
          variable_name: "order_id",
          value: orderId
        }
      ]
    },
    onSuccess: async (transaction: { reference: string }) => {
      try {
        await OrderService.updatePaymentStatus(orderId, "paid", transaction.reference);
        onSuccess(transaction.reference);
      } catch (error) {
        onError(error instanceof Error ? error : new Error("Failed to update order"));
      }
    },
    onError: (error: Error) => {
      onError(error);
    }
  });
}
