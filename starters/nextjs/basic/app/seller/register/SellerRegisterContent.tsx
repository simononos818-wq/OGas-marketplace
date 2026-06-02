'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_URL = 'https://us-central1-ogasapp-5a003.cloudfunctions.net/registerSeller';

export default function SellerRegisterContent() {
  const [formData, setFormData] = useState({
    businessName: '',
    phone: '',
    address: '',
    state: 'Delta',
    lga: 'Ughelli South',
    prices: { '3': 1500, '5': 2500, '6': 3000, '12.5': 5500 },
    gasSizes: ['3', '5', '6', '12.5'],
    hasDelivery: true,
    deliveryFee: 500,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to register');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">You're Now a Seller!</h2>
          <p className="text-gray-400 mb-2">Your shop is live on OGas.</p>
          <p className="text-gray-500 text-sm mb-6">Buyers can now find you and order gas.</p>
          <Link href="/" className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-bold">Go to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-24">
      <Link href="/" className="text-gray-400 text-sm mb-4 block">← Back to Home</Link>
      <h1 className="text-2xl font-bold mb-2">Become a Seller</h1>
      <p className="text-gray-400 text-sm mb-6">Register your gas shop and start earning</p>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Business Name *</label>
          <input type="text" required value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white" placeholder="e.g. OGas Station Oteri" />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Phone (WhatsApp) *</label>
          <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white" placeholder="+234..." />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Shop Address *</label>
          <input type="text" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white" placeholder="e.g. Oteri Market Road, Ughelli" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-400 block mb-1">State</label>
            <select value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white">
              <option value="Delta">Delta</option>
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">LGA</label>
            <input type="text" value={formData.lga} onChange={e => setFormData({...formData, lga: e.target.value})} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white" placeholder="e.g. Ughelli South" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="font-bold mb-3">Gas Prices (₦)</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(formData.prices).map(([size, price]) => (
              <div key={size}>
                <label className="text-xs text-gray-400 block mb-1">{size}kg</label>
                <input type="number" value={price} onChange={e => setFormData({...formData, prices: {...formData.prices, [size]: Number(e.target.value)}})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-900 rounded-xl p-4 border border-gray-800">
          <input type="checkbox" id="delivery" checked={formData.hasDelivery} onChange={e => setFormData({...formData, hasDelivery: e.target.checked})} className="w-5 h-5 accent-orange-500" />
          <div>
            <label htmlFor="delivery" className="font-bold block">I offer delivery</label>
            <p className="text-gray-400 text-xs">Buyers can request home delivery</p>
          </div>
        </div>
        {formData.hasDelivery && (
          <div>
            <label className="text-sm text-gray-400 block mb-1">Delivery Fee (₦)</label>
            <input type="number" value={formData.deliveryFee} onChange={e => setFormData({...formData, deliveryFee: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white" />
          </div>
        )}
        <button type="submit" disabled={submitting} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-lg transition disabled:opacity-50">
          {submitting ? 'Creating your shop...' : 'Start Selling on OGas'}
        </button>
      </form>
    </div>
  );
}
