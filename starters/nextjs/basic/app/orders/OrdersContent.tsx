'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = 'https://us-central1-ogasapp-5a003.cloudfunctions.net/getOrders';
const BUYER_PHONE_KEY = 'ogas_buyer_phone';

interface Order {
  id: string;
  buyerName: string;
  buyerPhone: string;
  sellerName: string;
  size: string;
  quantity: number;
  total: number;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: string;
  createdAt: string;
}

export default function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyerPhone, setBuyerPhone] = useState('');

  useEffect(() => {
    const phone = localStorage.getItem(BUYER_PHONE_KEY) || '';
    setBuyerPhone(phone);
    loadOrders(phone);
  }, []);

  async function loadOrders(phone: string) {
    try {
      const url = phone ? `${API_URL}?phone=${encodeURIComponent(phone)}` : API_URL;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/10';
      case 'confirmed': return 'text-blue-400 bg-blue-500/10';
      case 'out_for_delivery': return 'text-purple-400 bg-purple-500/10';
      case 'delivered': return 'text-green-400 bg-green-500/10';
      case 'cancelled': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'pending': return '⏳ Pending';
      case 'confirmed': return '✅ Confirmed';
      case 'out_for_delivery': return '🚚 Out for Delivery';
      case 'delivered': return '✓ Delivered';
      case 'cancelled': return '✕ Cancelled';
      default: return status;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-24">
      <Link href="/" className="text-gray-400 text-sm mb-4 block">← Back to Home</Link>
      <h1 className="text-2xl font-bold mb-2">My Orders</h1>
      <p className="text-gray-400 text-sm mb-4">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      
      {!buyerPhone && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
          <p className="text-yellow-400 text-sm">Enter your phone number to see your orders</p>
          <div className="flex gap-2 mt-2">
            <input 
              type="tel" 
              value={buyerPhone} 
              onChange={e => setBuyerPhone(e.target.value)} 
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-2 text-white text-sm"
              placeholder="+234..."
            />
            <button 
              onClick={() => { localStorage.setItem(BUYER_PHONE_KEY, buyerPhone); loadOrders(buyerPhone); }}
              className="bg-orange-500 text-white px-4 rounded-xl font-bold text-sm"
            >
              Load
            </button>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-400 text-lg mb-2">No orders yet</p>
          <p className="text-gray-500 text-sm mb-4">Your order history will appear here</p>
          <Link href="/buy" className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-bold">Order Gas Now</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">{order.sellerName || 'Unknown Seller'}</p>
                  <p className="text-gray-400 text-sm">{order.size}kg × {order.quantity}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                <div>
                  <p className="text-orange-400 font-bold">₦{order.total.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs">{order.paymentMethod === 'cash_on_delivery' ? '💵 Cash on Delivery' : '💳 Card Payment'}</p>
                </div>
                <p className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
