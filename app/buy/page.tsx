'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Product {
  name: string;
  price: number;
  productId: string;
  stock: number;
  unit: string;
}

interface Seller {
  id: string;
  businessName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  area: string;
  ownerName: string;
  products: Product[];
  deliveryFee: number;
  isAvailable: boolean;
  isActive: boolean;
  isVerified: boolean;
  rating?: number;
  reviewCount?: number;
  totalOrders?: number;
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
      const q = query(
        collection(db, 'sellers'), 
        where('isAvailable', '==', true),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Seller));
      setSellers(data);
    } catch (e) {
      console.error('Error loading sellers:', e);
      // Fallback: try without composite index
      try {
        const q2 = query(collection(db, 'sellers'), where('isAvailable', '==', true));
        const snap2 = await getDocs(q2);
        const data2 = snap2.docs.map(d => ({ id: d.id, ...d.data() } as Seller));
        setSellers(data2.filter(s => s.isActive !== false));
      } catch (e2) {
        console.error('Fallback also failed:', e2);
      }
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{seller.businessName}</h3>
                    <p className="text-sm text-gray-400 mt-1">📍 {seller.address}, {seller.city}</p>
                    <p className="text-sm text-gray-400">📞 {seller.phone}</p>
                    {seller.isVerified && (
                      <span className="inline-block mt-1 text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    {seller.rating && (
                      <div className="text-yellow-400 text-sm">⭐ {seller.rating}</div>
                    )}
                    <div className="text-gray-500 text-xs mt-1">
                      {seller.totalOrders || 0} orders
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {seller.products?.slice(0, 3).map(product => (
                      <span key={product.productId} className="text-xs bg-gray-700 px-2 py-1 rounded-md">
                        {product.name}: ₦{product.price?.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-gray-400 text-xs">
                    {seller.deliveryFee > 0 ? `Delivery: ₦${seller.deliveryFee}` : 'Free delivery'}
                  </span>
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
