'use client';

import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth'; // ← change this if your auth 
hook has a different name
import { Loader2, CheckCircle2, Truck, PackageCheck, XCircle, 
AlertTriangle } from 'lucide-react';
import { canTransition, OrderStatus } from '@/lib/orderStatus';

interface Props {
  orderId: string;
  currentStatus: OrderStatus;
  buyerId: string;
  sellerId: string;
  onStatusChange?: (newStatus: OrderStatus) => void;
}

export default function OrderStatusActions({
  orderId,
  currentStatus,
  buyerId,
  sellerId,
  onStatusChange,
}: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  if (!user) return null;

  const role =
    user.uid === buyerId ? 'buyer' :
    user.uid === sellerId ? 'seller' :
    'admin';

  const updateStatus = async (next: OrderStatus) => {
    if (!canTransition(currentStatus, next, role as any)) return;

    setLoading(next);
    try {
      const payload: any = {
        status: next,
        updatedAt: serverTimestamp(),
      };

      if (next === 'accepted') payload.sellerAcceptedAt = 
serverTimestamp();
      if (next === 'out_for_delivery') payload.outForDeliveryAt = 
serverTimestamp();
      if (next === 'delivered') payload.deliveredAt = serverTimestamp();
      if (next === 'completed') payload.buyerConfirmedAt = 
serverTimestamp();
      if (next === 'cancelled') payload.cancelledAt = serverTimestamp();

      await updateDoc(doc(db, 'orders', orderId), payload);
      onStatusChange?.(next);
    } catch (err) {
      console.error(err);
      alert('Failed to update status. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const buttons: { status: OrderStatus; label: string; icon: any; color: 
string }[] = [];

  if (role === 'seller') {
    if (currentStatus === 'pending') {
      buttons.push({
        status: 'accepted',
        label: 'Accept Order',
        icon: CheckCircle2,
        color: 'bg-green-600 hover:bg-green-500',
      });
    }
    if (currentStatus === 'accepted') {
      buttons.push({
        status: 'out_for_delivery',
        label: 'Out for Delivery',
        icon: Truck,
        color: 'bg-blue-600 hover:bg-blue-500',
      });
    }
    if (currentStatus === 'out_for_delivery') {
      buttons.push({
        status: 'delivered',
        label: 'Mark as Delivered',
        icon: PackageCheck,
        color: 'bg-orange-500 hover:bg-orange-400 text-black',
      });
    }
  }

  if (role === 'buyer') {
    if (['pending', 'accepted'].includes(currentStatus)) {
      buttons.push({
        status: 'cancelled',
        label: 'Cancel Order',
        icon: XCircle,
        color: 'bg-red-600 hover:bg-red-500',
      });
    }
    if (currentStatus === 'delivered') {
      buttons.push({
        status: 'completed',
        label: 'Confirm I Received the Gas',
        icon: CheckCircle2,
        color: 'bg-green-600 hover:bg-green-500',
      });
    }
    if (['delivered', 'out_for_delivery'].includes(currentStatus)) {
      buttons.push({
        status: 'disputed',
        label: 'Report a Problem',
        icon: AlertTriangle,
        color: 'bg-yellow-600 hover:bg-yellow-500 text-black',
      });
    }
  }

  if (buttons.length === 0) return null;

  return (
    <div className="space-y-3">
      {buttons.map((btn) => (
        <button
          key={btn.status}
          onClick={() => updateStatus(btn.status)}
          disabled={!!loading}
          className={`w-full flex items-center justify-center gap-2 
font-bold py-3.5 rounded-2xl transition ${btn.color} disabled:opacity-50`}
        >
          {loading === btn.status ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <btn.icon className="w-5 h-5" />
          )}
          {btn.label}
        </button>
      ))}
    </div>
  );
}
