'use client';

import { useState, useEffect } from 'react';
import { MapPin, Flame, Calculator, Star, Phone, Navigation, Search, Filter } from 'lucide-react';
import { db } from '@/app/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';

type Seller = {
  id: string;
  name: string;
  phone: string;
  rating: number;
  location: { lat: number; lng: number } | null;
  address: string;
  products: { name: string; price: number; kg: number }[];
  verified: boolean;
};

export default function BuyerPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [kgInput, setKgInput] = useState<number>(12.5);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setLocationError('Location access denied. Showing all sellers.')
      );
    }
  }, []);

  // Fetch sellers from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sellers'), (snapshot) => {
      const sellersData: Seller[] = [];
      snapshot.docs.forEach((doc) => {
        sellersData.push({ id: doc.id, ...doc.data() } as Seller);
      });
      setSellers(sellersData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Calculate distance between two points (Haversine formula)
  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Sort sellers by distance if location available
  const sortedSellers = [...sellers].sort((a, b) => {
    if (!userLocation || !a.location || !b.location) return 0;
    const distA = getDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng);
    const distB = getDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
    return distA - distB;
  });

  const filteredSellers = sortedSellers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCalculate = (seller: Seller) => {
    setSelectedSeller(seller);
    const product = seller.products?.[0];
    if (product) {
      const pricePerKg = product.price / product.kg;
      setCalculatedPrice(pricePerKg * kgInput);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold text-white">OGas Marketplace</h1>
            </div>
            {userLocation && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Location Active
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search sellers by name or area..." 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" 
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Calculator Section */}
        <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white">Gas Price Calculator</h2>
          </div>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-zinc-400 mb-2">KG Needed</label>
              <input 
                type="number" 
                value={kgInput} 
                onChange={(e) => setKgInput(Number(e.target.value))} 
                step="0.5" 
                min="1" 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" 
              />
            </div>
            <div className="flex-1">
              {calculatedPrice && selectedSeller && (
                <div className="bg-zinc-800 rounded-xl p-3">
                  <p className="text-xs text-zinc-400">Estimated Price at {selectedSeller.name}</p>
                  <p className="text-2xl font-bold text-orange-400">₦{calculatedPrice.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {locationError && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl mb-4 text-sm">
            {locationError}
          </div>
        )}

        {/* Sellers List */}
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-400" />
          {userLocation ? 'Nearest Sellers' : 'Available Sellers'}
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSellers.map((seller) => {
            const distance = userLocation && seller.location 
              ? getDistance(userLocation.lat, userLocation.lng, seller.location.lat, seller.location.lng).toFixed(1) 
              : null;
            
            const product = seller.products?.[0];

            return (
              <div key={seller.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-orange-500/50 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                      {seller.name}
                      {seller.verified && <Star className="w-4 h-4 text-green-400 fill-green-400" />}
                    </h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {seller.address || 'Nigeria'}
                    </p>
                  </div>
                  {distance && (
                    <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded-full">
                      {distance} km away
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-white">{seller.rating || '0.0'}</span>
                  <span className="text-xs text-zinc-500">({seller.totalOrders || 0} orders)</span>
                </div>

                {product && (
                  <div className="bg-zinc-800/50 rounded-xl p-3 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-300">{product.name}</span>
                      <span className="text-sm font-bold text-white">₦{product.price?.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{product.kg}kg cylinder</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCalculate(seller)} 
                    className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Calculate
                  </button>
                  <Link 
                    href={`/buyer/checkout?seller=${seller.id}`} 
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg text-center transition-colors"
                  >
                    Order Now
                  </Link>
                </div>

                <a href={`tel:${seller.phone}`} className="mt-2 flex items-center justify-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors py-2">
                  <Phone className="w-3 h-3" /> Call Seller
                </a>
              </div>
            );
          })}
        </div>

        {filteredSellers.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <Flame className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No sellers found</p>
            <p className="text-sm mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
