'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { MapPin, Flame, Star, Phone, ArrowLeft } from 'lucide-react';

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

export default function BuyGas() {
  const { user } = useAuth();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('all');
  const [error, setError] = useState('');

  const sizes = ['all', '3kg', '6kg', '12kg', '25kg', '50kg'];

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, 'sellers'),
        where('isActive', '==', true),
        orderBy('rating', 'desc')
      );
      const snapshot = await getDocs(q);
      const sellersData: Seller[] = [];
      snapshot.forEach(doc => {
        sellersData.push({ id: doc.id, ...doc.data() } as Seller);
      });
      setSellers(sellersData);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load sellers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = (sellerId: string, product: Product, mode: 'pickup' | 'delivery') => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (product.stock < 1) {
      alert('Sorry, this item is out of stock');
      return;
    }
    const params = new URLSearchParams({
      seller: sellerId,
      product: product.id,
      size: product.size,
      price: product.price.toString(),
      mode
    });
    router.push(`/checkout?${params.toString()}`);
  };

  const filteredSellers = sellers.map(seller => ({
    ...seller,
    products: selectedSize === 'all' 
      ? seller.products 
      : seller.products.filter(p => p.size === selectedSize)
  })).filter(seller => seller.products.length > 0);

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white pb-20">
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-6 h-6" />
                Buy Gas
              </h1>
              <p className="text-xs text-orange-100">Find sellers near you</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 w-full">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedSize === size 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25' 
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              {size === 'all' ? 'All Sizes' : size}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800">
            <Flame className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No sellers found</p>
            <p className="text-zinc-500 text-sm">Try a different cylinder size</p>
            <button 
              onClick={() => setSelectedSize('all')}
              className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition"
            >
              Show all sizes
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSellers.map((seller) => (
              <div key={seller.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-800/30 to-transparent">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        {seller.businessName}
                        {seller.isOnline && (
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        )}
                      </h3>
                      <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {seller.address}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-4 h-4 fill-amber-400" />
                          {seller.rating > 0 ? seller.rating.toFixed(1) : 'New'}
                        </span>
                        <span className="text-zinc-500">({seller.reviewCount} reviews)</span>
                        {seller.hasDelivery && (
                          <span className="text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full">
                            🚚 Delivery
                          </span>
                        )}
                      </div>
                    </div>
                    <a 
                      href={`tel:${seller.phone}`}
                      className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                <div className="divide-y divide-zinc-800">
                  {seller.products.map((product) => (
                    <div key={product.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition">
                      <div>
                        <p className="font-medium text-white flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-500" />
                          {product.brand} {product.size}
                        </p>
                        <p className={`text-sm mt-1 ${product.stock < 3 ? 'text-red-400' : 'text-zinc-500'}`}>
                          {product.stock} in stock
                          {product.stock < 3 && ' - Low!'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-orange-400">
                          ₦{product.price.toLocaleString()}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleOrder(seller.id, product, 'pickup')}
                            disabled={product.stock < 1}
                            className="px-3 py-1.5 text-sm border border-orange-500 text-orange-400 rounded-lg hover:bg-orange-500/10 transition disabled:opacity-50"
                          >
                            Pickup
                          </button>
                          {seller.hasDelivery && (
                            <button
                              onClick={() => handleOrder(seller.id, product, 'delivery')}
                              disabled={product.stock < 1}
                              className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
