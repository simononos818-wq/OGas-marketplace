'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Flame, Star, Phone, ArrowLeft, Search, ShoppingCart, Truck, Package, X, Home, ClipboardList, User } from 'lucide-react';
import { BottomNav } from '../components/MobileNav';

function SkeletonCard() {
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 bg-zinc-800 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-3/4" />
          <div className="h-3 bg-zinc-800 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        active ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
      }`}>
      {label}
    </button>
  );
}

function SellerCard({ seller, onOrder }: { seller: any; onOrder: (seller: any, type: string) => void }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Flame className="w-7 h-7 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm text-white truncate">{seller.businessName}</h3>
              {seller.isOnline && <span className="w-2 h-2 bg-green-500 rounded-full" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {seller.rating}</span>
              <span>({seller.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{seller.address}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          {seller.hasDelivery ? (
            <span className="px-2 py-1 bg-green-500/15 text-green-400 text-[10px] font-medium rounded flex items-center gap-1">
              <Truck className="w-3 h-3" /> Delivery
            </span>
          ) : (
            <span className="px-2 py-1 bg-zinc-800 text-zinc-500 text-[10px] font-medium rounded flex items-center gap-1">
              <Package className="w-3 h-3" /> Pickup Only
            </span>
          )}
          <span className="px-2 py-1 bg-blue-500/15 text-blue-400 text-[10px] font-medium rounded">Open Now</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="space-y-2">
          {seller.products?.map((product: any) => (
            <div key={product.id} className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{product.size}kg Cylinder</p>
                <p className="text-xs text-zinc-500">{product.brand} - {product.stock} in stock</p>
              </div>
              <div className="text-right">
                <p className="text-orange-400 font-bold text-sm">{product.price}</p>
                <div className="flex items-center gap-1 mt-1">
                  <button onClick={() => onOrder(seller, 'pickup')}
                    className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] rounded hover:bg-zinc-700 transition">Pickup</button>
                  {seller.hasDelivery && (
                    <button onClick={() => onOrder(seller, 'delivery')}
                      className="px-2 py-1 bg-orange-600 text-white text-[10px] rounded hover:bg-orange-500 transition">Delivery</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-2">
        <a href={`tel:${seller.phone}`}
          className="flex-1 py-2.5 bg-zinc-800 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition">
          <Phone className="w-4 h-4" /> Call
        </a>
        <button onClick={() => onOrder(seller, seller.hasDelivery ? 'delivery' : 'pickup')}
          className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:from-orange-600 hover:to-amber-600 transition">
          <ShoppingCart className="w-4 h-4" /> Order
        </button>
      </div>
    </div>
  );
}

export default function BuyPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('Detecting location...');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSellers([
        {
          id: '1', businessName: 'Oteri Gas Depot', address: 'Oteri Road, Ughelli, Delta State',
          phone: '+2348012345678', hasDelivery: true, deliveryFee: 500, isOnline: true, rating: 4.8, reviewCount: 124,
          products: [
            { id: 'p1', size: '3', price: '3,600', stock: 15, brand: 'Total' },
            { id: 'p2', size: '5', price: '6,000', stock: 8, brand: 'Oando' },
            { id: 'p3', size: '12.5', price: '15,000', stock: 5, brand: 'Navgas' },
          ]
        },
        {
          id: '2', businessName: 'Ughelli Gas Hub', address: 'Market Road, Ughelli, Delta State',
          phone: '+2348098765432', hasDelivery: true, deliveryFee: 300, isOnline: true, rating: 4.5, reviewCount: 89,
          products: [
            { id: 'p4', size: '3', price: '3,500', stock: 20, brand: 'Oando' },
            { id: 'p5', size: '6', price: '7,200', stock: 12, brand: 'Total' },
            { id: 'p6', size: '25', price: '30,000', stock: 3, brand: 'Navgas' },
          ]
        },
        {
          id: '3', businessName: 'Delta Gas Mart', address: 'Express Way, Warri, Delta State',
          phone: '+2348034567890', hasDelivery: false, isOnline: false, rating: 4.2, reviewCount: 56,
          products: [
            { id: 'p7', size: '5', price: '5,800', stock: 10, brand: 'Total' },
            { id: 'p8', size: '12.5', price: '14,500', stock: 7, brand: 'Oando' },
          ]
        },
      ]);
      setLoading(false);
      setLocation('Oteri, Ughelli');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleOrder = useCallback((seller: any, type: string) => {
    const orderData = { seller, type, timestamp: Date.now() };
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    router.push('/buyer/checkout');
  }, [router]);

  const filteredSellers = sellers.filter(seller => {
    if (searchQuery && !seller.businessName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeFilter === 'delivery' && !seller.hasDelivery) return false;
    if (activeFilter === 'pickup' && seller.hasDelivery) return false;
    return true;
  });

  return (
    <main className="min-h-screen w-full bg-zinc-950 pb-24">
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-sm text-white">Buy Gas</h1>
            <p className="text-[10px] text-zinc-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {location}</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-3">
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
          <Search className="w-5 h-5 text-zinc-500" />
          <input type="text" placeholder="Search sellers or cylinder sizes..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none" />
          {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-4 h-4 text-zinc-500" /></button>}
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <FilterChip label="All" active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
          <FilterChip label="Delivery" active={activeFilter === 'delivery'} onClick={() => setActiveFilter('delivery')} />
          <FilterChip label="Pickup" active={activeFilter === 'pickup'} onClick={() => setActiveFilter('pickup')} />
        </div>
      </div>

      <div className="px-4 py-2 flex items-center justify-between">
        <p className="text-xs text-zinc-500">{loading ? 'Finding sellers...' : `${filteredSellers.length} sellers found`}</p>
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : filteredSellers.length === 0 ? (
          <div className="text-center py-12">
            <Flame className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No sellers found</p>
            <p className="text-zinc-600 text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredSellers.map(seller => <SellerCard key={seller.id} seller={seller} onOrder={handleOrder} />)
        )}
      </div>

      <BottomNav active="buy" />
    </main>
  );
}
