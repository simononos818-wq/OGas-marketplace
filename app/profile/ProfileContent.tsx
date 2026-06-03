'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const BUYER_PHONE_KEY = 'ogas_buyer_phone';
const BUYER_NAME_KEY = 'ogas_buyer_name';

export default function ProfileContent() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ordersCount, setOrdersCount] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem(BUYER_NAME_KEY) || '');
    setPhone(localStorage.getItem(BUYER_PHONE_KEY) || '');
    
    // Count orders for this phone
    const phone = localStorage.getItem(BUYER_PHONE_KEY);
    if (phone) {
      fetch(`https://us-central1-ogasapp-5a003.cloudfunctions.net/getOrders?phone=${encodeURIComponent(phone)}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) setOrdersCount(data.count);
        })
        .catch(() => {});
    }
  }, []);

  function saveProfile() {
    localStorage.setItem(BUYER_NAME_KEY, name);
    localStorage.setItem(BUYER_PHONE_KEY, phone);
    setEditing(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-24">
      <Link href="/" className="text-gray-400 text-sm mb-4 block">← Back to Home</Link>
      
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold">
          {name ? name[0].toUpperCase() : '👤'}
        </div>
        {editing ? (
          <div className="space-y-2 max-w-xs mx-auto">
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2 text-white text-center"
              placeholder="Your name"
            />
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2 text-white text-center"
              placeholder="Phone number"
            />
            <button onClick={saveProfile} className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm">Save</button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold">{name || 'Guest User'}</h1>
            <p className="text-gray-400 text-sm">{phone || 'No phone set'}</p>
            <button onClick={() => setEditing(true)} className="text-orange-400 text-xs mt-2">Edit Profile</button>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <p className="text-2xl font-bold text-orange-400">{ordersCount}</p>
          <p className="text-xs text-gray-400">Orders</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <p className="text-2xl font-bold text-green-400">0</p>
          <p className="text-xs text-gray-400">Delivered</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <p className="text-2xl font-bold text-blue-400">Active</p>
          <p className="text-xs text-gray-400">Status</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <Link href="/orders" className="block bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-orange-500/30 transition flex justify-between items-center">
          <span className="font-bold">📦 My Orders</span>
          <span className="text-gray-400">→</span>
        </Link>
        <Link href="/buy" className="block bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-orange-500/30 transition flex justify-between items-center">
          <span className="font-bold">🔥 Order Gas</span>
          <span className="text-gray-400">→</span>
        </Link>
        <Link href="/seller/register" className="block bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-orange-500/30 transition flex justify-between items-center">
          <span className="font-bold">🏪 Become a Seller</span>
          <span className="text-gray-400">→</span>
        </Link>
      </div>

      <div className="mt-6 bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="font-bold mb-2">💡 Pro Tip</h3>
        <p className="text-gray-400 text-sm">Set your phone number so your orders are saved and you can track them here.</p>
      </div>
    </div>
  );
}
