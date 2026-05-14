'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { MapPin, Flame, Star, Phone, ArrowLeft, ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  size: string;
  price: number;
  stock: number;
  brand: string;
}

interface Seller {
  id: string;
  businessName: string;
  address: string;
  phone: string;
  hasDelivery: boolean;
  deliveryFee?: number;
  isOnline: boolean;
  rating: number;
  reviewCount: number;
  products: Product[];
}

export default function BuyClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'delivery' | 'pickup'>('all');

  const fetchSellers = useCallback(async () => {
    try {
      const q = query(collection(db, 'vendors'), where('isVerified', '==', true));
      const snap = await getDocs(q);
      const results: Seller[] = [];

      for (const docSnap of snap.docs) {
        const vendor = { id: docSnap.id, ...docSnap.data() } as Seller;
        const invSnap = await getDocs(collection(db, 'vendors', docSnap.id, 'inventory'));
        const products = invSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })).filter((p: any) => p.quantity > 0) as Product[];

        if (products.length > 0) {
          results.push({ ...vendor, products });
        }
      }
      setSellers(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleCheckout = (seller: Seller, product: Product, type: 'pickup' | 'delivery') => {
    const params = new URLSearchParams({
      sellerId: seller.id,
      productId: product.id,
      size: product.size,
      brand: product.brand,
      price: product.price.toString(),
      qty: '1',
      type,
      fee: (seller.deliveryFee || 0).toString(),
    });
    router.push(`/buyer/checkout?${params.toString()}`);
  };

  const filtered = sellers.filter(s => {
    if (filter === 'delivery') return s.hasDelivery;
    if (filter === 'pickup') return !s.hasDelivery;
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="ml-2 font-bold text-lg">Buy Gas</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {(['all', 'delivery', 'pickup'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition ${
                filter === f
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Flame className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No sellers found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(seller => (
              <SellerCard key={seller.id} seller={seller} onCheckout={handleCheckout} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SellerCard({ seller, onCheckout }: { seller: Seller; onCheckout: (s: Seller, p: Product, t: 'pickup' | 'delivery') => void }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Seller Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-white">{seller.businessName}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-amber-400 text-sm font-medium">{seller.rating || 4.5}</span>
              <span className="text-zinc-500 text-sm">({seller.reviewCount || 0})</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-zinc-400 text-xs">
              <MapPin className="w-3 h-3" />
              {seller.address}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">Open</span>
            {seller.hasDelivery && (
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">Delivery</span>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="p-4 space-y-3">
        {seller.products.map(product => (
          <div key={product.id} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
            <div>
              <p className="font-semibold text-sm">{product.size} Cylinder</p>
              <p className="text-zinc-400 text-xs">{product.brand} - {product.stock} in stock</p>
            </div>
            <div className="text-right">
              <p className="text-orange-400 font-bold">₦{product.price.toLocaleString()}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onCheckout(seller, product, 'pickup')}
                  className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition"
                >
                  Pickup
                </button>
                {seller.hasDelivery && (
                  <button
                    onClick={() => onCheckout(seller, product, 'delivery')}
                    className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition"
                  >
                    Delivery
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
