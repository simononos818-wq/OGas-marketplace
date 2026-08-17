'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from './context/AuthContext';
import { MapPin, Search, Flame, Star, Phone, Navigation, Store, ChevronRight, Loader2, Tag, Clock } from 'lucide-react';
import Link from 'next/link';

interface Product {
  productId: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
}

interface Seller {
  id: string;
  businessName: string;
  address: string;
  phone: string;
  pricePerKg?: number;
  prices?: Record<string, number>;
  products?: Product[];
  deliveryFee?: number;
  rating: number;
  totalOrders: number;
  isActive?: boolean;
  isOnline?: boolean;
  isApproved?: boolean;
  verified?: boolean;
  isVerified?: boolean;
  sellerStatus?: string;
  statusBadge?: string;
  city?: string;
  state?: string;
  location?: { latitude: number; longitude: number };
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getSellerPrice(seller: Seller): number {
  if (seller.pricePerKg && !isNaN(seller.pricePerKg)) return seller.pricePerKg;
  if (seller.products && seller.products.length > 0) {
    const kg12 = seller.products.find(p => p.productId === 'refill-12.5kg');
    if (kg12 && !isNaN(kg12.price)) return kg12.price;
    const kg6 = seller.products.find(p => p.productId === 'refill-6kg');
    if (kg6 && !isNaN(kg6.price)) return kg6.price;
    return seller.products[0].price;
  }
  if (seller.prices) {
    const vals = Object.values(seller.prices).filter(v => typeof v === 'number' && !isNaN(v));
    if (vals.length > 0) return vals[0];
  }
  return 1600;
}

export default function HomePage() {
  const { user } = useAuthContext();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { setLocationError('Location access denied. Showing all sellers.'); setUserLocation(null); },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        // Fetch ALL sellers that are not explicitly inactive
        // (pending + approved both appear; we control display client-side)
        const snap = await getDocs(collection(db, 'sellers'));
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Seller))
          .filter((s) => s.isActive !== false); // only hide fully disabled ones

        setSellers(data);
        console.log('Loaded', data.length, 'sellers (including pending)');
      } catch (err) {
        console.error('Query failed:', err);
        setSellers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, []);

  useEffect(() => {
    let result = [...sellers];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.businessName.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.state && s.state.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'distance' && userLocation) {
      result.sort((a, b) => {
        if (!a.location) return 1;
        if (!b.location) return -1;
        const da = getDistance(userLocation.lat, userLocation.lng, a.location.latitude, a.location.longitude);
        const db_ = getDistance(userLocation.lat, userLocation.lng, b.location.latitude, b.location.longitude);
        return da - db_;
      });
    } else if (sortBy === 'price') {
      result.sort((a, b) => getSellerPrice(a) - getSellerPrice(b));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    setFilteredSellers(result);
  }, [sellers, searchQuery, sortBy, userLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-orange-500 text-black px-4 py-2 text-center text-sm font-bold">
        🔥 OGas Promo: Save ₦50/kg on every order today! 🔥
      </div>

      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {!logoError ? (
                <img src="/ogas-logo.svg" alt="OGas" className="h-8 w-auto" onError={() => setLogoError(true)} />
              ) : (
                <div className="flex items-center gap-1">
                  <Flame className="w-6 h-6 text-orange-500" />
                  <span className="text-xl font-bold text-orange-500">OGas</span>
                </div>
              )}
            </div>
            {user ? (
              <Link href="/profile" className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold">
                {user.email?.[0].toUpperCase()}
              </Link>
            ) : (
              <Link href="/login" className="text-sm text-orange-400 font-medium">Login</Link>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sellers by name, area, or city..."
              className="w-full bg-gray-900 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center justify-between mt-2 pb-2">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Navigation className="w-3 h-3" />
              {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : locationError || 'Getting location...'}
            </div>
            <div className="flex gap-1">
              {(['distance', 'price', 'rating'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition ${sortBy === s ? 'bg-orange-500 text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                  {s === 'distance' ? 'Nearby' : s === 'price' ? 'Cheapest' : 'Top Rated'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {filteredSellers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No sellers found</p>
            <p className="text-sm mt-1">{searchQuery ? `No results for "${searchQuery}"` : 'No approved sellers available'}</p>
            <Link href="/seller/register" className="inline-block mt-4 text-orange-400 text-sm font-medium">Become a Seller →</Link>
          </div>
        ) : (
          filteredSellers.map((seller) => {
            const price = getSellerPrice(seller);
            const discountPrice = price - 50;
            const isPreRegistered = seller.sellerStatus === 'pre-registered';
            const isPending = seller.sellerStatus === 'pending' || seller.isApproved === false;
            let distanceText = '';
            if (userLocation && seller.location) {
              const dist = getDistance(userLocation.lat, userLocation.lng, seller.location.latitude, seller.location.longitude);
              distanceText = dist < 1 ? `${(dist * 1000).toFixed(0)}m away` : `${dist.toFixed(1)}km away`;
            }

            return (
              <Link
                key={seller.id}
                href={(isPreRegistered || isPending) ? '#' : `/buy/${seller.id}`}
                onClick={(e) => { if (isPreRegistered || isPending) { e.preventDefault(); alert(isPreRegistered ? 'This seller is coming soon! They are not accepting orders yet.' : 'This seller is still pending approval and cannot take orders yet.'); } }}
                className={`block bg-gray-900 rounded-2xl p-4 hover:bg-gray-800 transition group ${(isPreRegistered || isPending) ? 'opacity-75 border border-dashed border-gray-700' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg group-hover:text-orange-400 transition">{seller.businessName}</h3>
                      {isPreRegistered && <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />Coming Soon</span>}
                      {isPending && <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-400 text-xs rounded-full">Pending Approval</span>}
                      {!isPreRegistered && !isPending && <div className={`w-2 h-2 rounded-full ${seller.isOnline || seller.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1"><MapPin className="w-3.5 h-3.5" />{seller.address}{seller.city && <span className="text-gray-600">, {seller.city}</span>}</div>
                    {distanceText && <div className="flex items-center gap-1 text-xs text-orange-400 mt-1"><Navigation className="w-3 h-3" />{distanceText}</div>}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /><span className="text-sm font-medium">{seller.rating || 4.5}</span><span className="text-xs text-gray-500">({seller.totalOrders || 0})</span></div>
                      <div className="flex items-center gap-1 text-sm text-gray-400"><Phone className="w-3.5 h-3.5" />{seller.phone}</div>
                    </div>
                    {!isPreRegistered && !isPending && <div className="flex items-center gap-1 mt-2"><Tag className="w-3 h-3 text-green-400" /><span className="text-xs text-green-400 font-medium">Save ₦50/kg with OGas!</span></div>}
                  </div>
                  <div className="text-right">
                    {!isPreRegistered && !isPending ? (
                      <>
                        <div className="text-xs text-gray-500 line-through">₦{price}/kg</div>
                        <div className="text-lg font-bold text-orange-400">₦{discountPrice}<span className="text-xs text-gray-500 font-normal">/kg</span></div>
                        <div className="text-xs text-gray-500 mt-1">Delivery ₦{seller.deliveryFee || 500}</div>
                        <ChevronRight className="w-5 h-5 text-gray-600 mt-2 ml-auto" />
                      </>
                    ) : (
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-500">₦{price}<span className="text-xs text-gray-600 font-normal">/kg</span></div>
                        <span className="text-xs text-gray-500 mt-1 block">{isPreRegistered ? 'Not accepting orders' : 'Awaiting approval'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Link href="/seller/register" className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-medium text-center text-sm hover:bg-gray-700 transition">Sell Gas</Link>
          <Link href="/orders" className="flex-1 bg-orange-500 text-black py-3 rounded-xl font-bold text-center text-sm hover:bg-orange-400 transition">My Orders</Link>
        </div>
      </div>
    </div>
  );
}
