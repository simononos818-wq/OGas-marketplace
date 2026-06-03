"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOrders, Order } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/gasCalculator';
import { Package, ChevronLeft, Clock, MapPin, Phone, Flame, CheckCircle, Truck, AlertCircle } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-yellow-400', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-blue-400', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'text-orange-400', icon: Flame },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-purple-400', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-400', icon: CheckCircle },
  completed: { label: 'Completed', color: 'text-green-400', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-400', icon: AlertCircle },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyerPhone, setBuyerPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(true);
  const { subscribeToBuyerOrders } = useOrders();

  // Load saved phone
  useEffect(() => {
    const saved = localStorage.getItem('ogas_buyer_info');
    if (saved) {
      try {
        const info = JSON.parse(saved);
        setBuyerPhone(info.phone || '');
        setPhoneInput(info.phone || '');
      } catch {}
    }
    setLoading(false);
  }, []);

  // Subscribe to orders when phone is available
  useEffect(() => {
    if (!buyerPhone) return;
    
    const unsubscribe = subscribeToBuyerOrders(buyerPhone, (data) => {
      setOrders(data);
    });
    
    return () => unsubscribe();
  }, [buyerPhone, subscribeToBuyerOrders]);

  const handleLookup = () => {
    if (phoneInput.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }
    setBuyerPhone(phoneInput);
    localStorage.setItem('ogas_buyer_info', JSON.stringify({
      ...JSON.parse(localStorage.getItem('ogas_buyer_info') || '{}'),
      phone: phoneInput,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-orange-500">Loading...</div>
      </div>
    );
  }

  if (!buyerPhone) {
    return (
      <div className="min-h-screen bg-black pb-24">
        <div className="px-4 pt-6 pb-4">
          <Link href="/" className="flex items-center gap-2 text-gray-400 mb-6">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">My Orders</h1>
          <p className="text-gray-500 text-sm mb-6">Enter your phone number to see your orders</p>
          
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors mb-4"
            />
            <button
              onClick={handleLookup}
              className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold active:scale-[0.98] transition-transform"
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2 text-gray-400">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </Link>
          <button
            onClick={() => setBuyerPhone('')}
            className="text-gray-500 text-xs"
          >
            Change Number
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">My Orders</h1>
        <p className="text-gray-500 text-sm">{buyerPhone}</p>
      </div>

      {orders.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 text-sm mb-2">No orders yet</p>
          <p className="text-gray-600 text-xs mb-4">Place your first gas order!</p>
          <Link
            href="/buy"
            className="inline-block bg-orange-500 text-white rounded-xl px-6 py-3 font-semibold text-sm"
          >
            Browse Sellers
          </Link>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {orders.map((order) => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            
            return (
              <div
                key={order.id}
                className="bg-dark-card border border-dark-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{order.sellerName}</p>
                    <p className="text-gray-500 text-xs">#{order.id?.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className={`flex items-center gap-1 ${status.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">{status.label}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.kg}kg x {item.quantity}</span>
                      <span className="text-white">{formatPrice(item.kg * item.pricePerKg * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dark-border pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {order.deliveryAddress?.slice(0, 30)}...
                    </p>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {order.sellerPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-bold">{formatPrice(order.total)}</p>
                    <p className="text-gray-600 text-xs capitalize">{order.paymentMethod?.replace('_', ' ')}</p>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-dark-border">
                    <p className="text-yellow-400 text-xs">Waiting for seller to confirm...</p>
                  </div>
                )}

                {order.status === 'out_for_delivery' && (
                  <div className="mt-3 pt-3 border-t border-dark-border">
                    <p className="text-purple-400 text-xs flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Your gas is on the way!
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 pb-safe z-50">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2 text-gray-400">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/buy" className="flex flex-col items-center p-2 text-gray-400">
            <span className="text-xl">🔥</span>
            <span className="text-xs font-medium">Buy</span>
          </Link>
          <Link href="/orders" className="flex flex-col items-center p-2 text-orange-500">
            <span className="text-xl">📦</span>
            <span className="text-xs font-medium">Orders</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center p-2 text-gray-400">
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
