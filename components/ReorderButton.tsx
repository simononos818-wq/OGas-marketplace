'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/lib/orderService';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from './Toast';
import { RotateCcw } from 'lucide-react';

interface Props {
  previousOrder: any;
}

export function ReorderButton({ previousOrder }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReorder = async () => {
    if (!user) {
      showToast('Please sign in to reorder', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderId = await createOrder({
        customerId: user.uid,
        customerName: user.displayName || 'Customer',
        customerPhone: previousOrder.customerPhone,
        vendorId: previousOrder.vendorId,
        vendorName: previousOrder.vendorName,
        vendorAddress: previousOrder.vendorAddress,
        vendorLocation: previousOrder.vendorLocation,
        items: previousOrder.items,
        mode: previousOrder.mode,
        subtotal: previousOrder.subtotal,
        deliveryFee: previousOrder.deliveryFee,
        total: previousOrder.total,
        paymentMethod: 'paystack',
        paymentRef: '',
        paidAt: null,
        ...(previousOrder.mode === 'delivery' && {
          deliveryAddress: previousOrder.deliveryAddress,
          deliveryLocation: previousOrder.deliveryLocation
        })
      });
      
      showToast('Order placed! Redirecting to payment...', 'success');
      router.push(`/buyer/checkout?reorder=${orderId}`);
    } catch (err) {
      showToast('Failed to reorder. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleReorder}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
    >
      <RotateCcw className="w-4 h-4" />
      {loading ? 'Processing...' : 'Reorder'}
    </button>
  );
}
