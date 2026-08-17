'use client';

import { useSellers } from '../hooks/useSellers';
import { useLocation } from '../hooks/useLocation';
import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';

export default function BuyPage() {
  const { location, loading: locLoading } = useLocation();
  // FIX: Only pass location if no error and valid coords
  const hasValidLocation = location && !location.error && location.lat !== 0 && location.lng !== 0;
  const { sellers, loading: sellersLoading } = useSellers(
    hasValidLocation ? location.lat : undefined,
    hasValidLocation ? location.lng : undefined
  );
  const [search, setSearch] = useState('');

  const filtered = sellers.filter(s => 
    s.businessName.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  if (locLoading || sellersLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-orange-500 animate-pulse">Finding gas sellers near you...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Search Header */}
      <div className="bg-gradient-to-b from-orange-900/30 to-black px-4 pt-4 pb-4 sticky top-0 z-40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search sellers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
        </div>
        
        {hasValidLocation && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
            GPS Active • {sellers.length} sellers nearby
          </p>
        )}
        {(!hasValidLocation && location) && (
          <p className="text-xs text-red-400 mt-2">Location unavailable - showing all sellers</p>
        )}
      </div>

      {/* Seller List */}
      <div className="px-4 space-y-4 mt-2">
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg">No sellers found</p>
            <p className="text-sm">Be the first to register as a seller!</p>
            <Link href="/seller/register" className="text-orange-400 underline mt-2 inline-block">Register as Seller</Link>
          </div>
        )}

        {filtered.map((seller) => (
          <Link 
            key={seller.id} 
            href={`/buy/${seller.id}`}
            className="block bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-orange-500/50 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="text-orange-500 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{seller.businessName}</h3>
                <p className="text-sm text-gray-400 truncate">{seller.address}</p>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="text-orange-400 font-medium">₦{(seller.pricePerKg || 0).toLocaleString()}/kg</span>
                  {hasValidLocation && seller.location && (
                    <span className="text-green-400 flex items-center gap-1">
                      📍 {(getDistance(location.lat, location.lng, seller.location.lat, seller.location.lng)).toFixed(1)} km away
                    </span>
                  )}
                  {seller.deliveryFee > 0 ? (
                    <span className="text-blue-400">🚚 Delivery ₦{seller.deliveryFee}</span>
                  ) : (
                    <span className="text-gray-500">🏪 Pickup only</span>
                  )}
                </div>
              </div>

              <div className="bg-orange-500 text-black font-bold px-4 py-2 rounded-xl text-sm shrink-0 self-center">
                Order
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
