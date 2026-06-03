'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = 'https://us-central1-ogasapp-5a003.cloudfunctions.net/getVendors';

interface Vendor {
  id: string;
  businessName: string;
  phone: string;
  address: string;
  isVerified: boolean;
}

export default function AdminContent() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setVendors(data.vendors || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-950 text-white p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-24">
      <Link href="/" className="text-gray-400 text-sm mb-4 block">Back to Home</Link>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-orange-400">{vendors.length}</p>
          <p className="text-xs text-gray-400">Vendors</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-green-400">0</p>
          <p className="text-xs text-gray-400">Orders Today</p>
        </div>
      </div>
      
      <h2 className="font-bold mb-3">Vendors</h2>
      <div className="space-y-3">
        {vendors.map(v => (
          <div key={v.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between mb-1">
              <span className="font-bold">{v.businessName}</span>
              <span className={`text-xs px-2 py-1 rounded ${v.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{v.isVerified ? 'Verified' : 'Pending'}</span>
            </div>
            <p className="text-gray-400 text-sm">{v.phone}</p>
            <p className="text-gray-500 text-xs">{v.address}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
