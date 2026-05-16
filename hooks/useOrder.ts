import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export const useOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (orderData: {
    sellerId: string;
    quantity: number;
    deliveryAddress: string;
    deliveryCoordinates?: { lat: number; lng: number };
    gasCost: number;
    deliveryFee: number;
    totalAmount: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const createOrderFn = httpsCallable(functions, 'createOrder');
      const result = await createOrderFn(orderData);
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const initializePayment = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const initPaymentFn = httpsCallable(functions, 'initializePayment');
      const result = await initPaymentFn({ orderId });
      return result.data as { success: boolean; authorizationUrl: string; reference: string };
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async (orderId: string, rating?: number, review?: string) => {
    setLoading(true);
    setError(null);
    try {
      const confirmFn = httpsCallable(functions, 'buyerConfirmDelivery');
      const result = await confirmFn({ orderId, rating, review });
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to confirm delivery');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const openDispute = async (orderId: string, reason: string, description: string) => {
    setLoading(true);
    setError(null);
    try {
      const disputeFn = httpsCallable(functions, 'createDispute');
      const result = await disputeFn({ orderId, reason, description });
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to open dispute');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrder,
    initializePayment,
    confirmDelivery,
    openDispute,
    loading,
    error
  };
};
