'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Seller {
  id: string;
  businessName: string;
  phone: string;
  address: string;
  gasSizes: string[];
  prices: Record<string, number>;
  deliveryFee: number;
  isAvailable: boolean;
  rating?: number;
}

export default function BuyPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('Oteri Ughelli');

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      const q = query(collection(db, 'vendors'), where('isApproved', '==', true));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Seller));
      setSellers(data.filter(s => s.isAvailable !== false));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="sticky top-0 z-50 bg-gray-900/95 border-b border-gray-800 backdrop-blur">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg">Order Gas</h1>
          <span className="text-xs text-gray-400">📍 {location}</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {sellers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No sellers available in your area yet.</p>
            <p className="text-sm text-gray-500 mt-2">Be the first to sell on OGas!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sellers.map(seller => (
              <Link
                key={seller.id}
                href={`/buy/${seller.id}/`}
                className="block bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-orange-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white">{seller.businessName}</h3>
                    <p className="text-sm text-gray-400 mt-1">📍 {seller.address}</p>
                    <p className="text-sm text-gray-400">📞 {seller.phone}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-bold">
                      {seller.gasSizes?.map(size => (
                        <span key={size} className="block text-sm">₦{seller.prices?.[size]?.toLocaleString() || '0'}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2">
                    {seller.gasSizes?.slice(0, 3).map(size => (
                      <span key={size} className="text-xs bg-gray-700 px-2 py-1 rounded-md">{size}kg</span>
                    ))}
                  </div>
                  <span className="text-orange-400 font-bold text-sm">Order Now →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
