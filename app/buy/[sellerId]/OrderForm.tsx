'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function OrderForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sellerId = params.sellerId as string;
  
  const [kgSize, setKgSize] = useState(12);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const gasPrice = 1200;
  const deliveryFee = 500;
  const totalAmount = (kgSize * gasPrice) + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/whatsapp-order/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, phone, address, kgSize, name: 'Customer' }),
      });
      const data = await res.json();
      if (data.whatsappUrl) {
        window.location.href = data.whatsappUrl;
      }
    } catch (err) {
      alert('Order failed. Please call the seller directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto pt-8">
        <h1 className="text-2xl font-bold mb-6">Order Gas</h1>
        
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-400 mb-2">Select Size</p>
          <div className="flex gap-2">
            {[3, 6, 12.5, 25].map((size) => (
              <button
                key={size}
                onClick={() => setKgSize(size)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                  kgSize === size ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {size}kg
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Delivery Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="No. 5, Oteri Road, Ughelli"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
              required
            />
          </div>

          <div className="bg-gray-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">{kgSize}kg Gas</span>
              <span>₦{(kgSize * gasPrice).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Delivery</span>
              <span className="text-green-400">₦{deliveryFee.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-orange-400">₦{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Order via WhatsApp - ₦${totalAmount.toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  );
}
