import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export const useSellerOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const acceptFn = httpsCallable(functions, 'sellerAcceptOrder');
      const result = await acceptFn({ orderId });
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to accept order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const declineOrder = async (orderId: string, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const declineFn = httpsCallable(functions, 'sellerDeclineOrder');
      const result = await declineFn({ orderId, reason });
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to decline order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const dispatchOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const dispatchFn = httpsCallable(functions, 'sellerDispatchOrder');
      const result = await dispatchFn({ orderId });
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markDelivered = async (orderId: string, deliveryPhoto?: string) => {
    setLoading(true);
    setError(null);
    try {
      const deliveredFn = httpsCallable(functions, 'sellerMarkDelivered');
      const result = await deliveredFn({ orderId, deliveryPhoto });
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to mark delivered');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    acceptOrder,
    declineOrder,
    dispatchOrder,
    markDelivered,
    loading,
    error
  };
};
