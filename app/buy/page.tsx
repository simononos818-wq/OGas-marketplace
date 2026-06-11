'use client';

import { useLocation } from '../hooks/useLocation';
import { useSellers } from '../hooks/useSellers';
import Link from 'next/link';
import { useState } from 'react';

export default function BuyPage() {
  const { location, loading: locLoading } = useLocation();
  const { sellers, loading: sellersLoading } = useSellers(location?.lat, location?.lng);
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
      <div className="bg-gradient-to-b from-orange-900/30 to-black px-4 pt-4 pb-4 sticky top-14 z-40">
        <input
          type="text"
          placeholder="Search gas sellers near you..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
        {location && !location.error && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
            GPS Active • {sellers.length} sellers nearby
          </p>
        )}
        {location?.error && (
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

        {filtered.map((seller, index) => (
          <Link 
            key={seller.id} 
            href={`/buy/${seller.id}`}
            className="block bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-orange-500/50 transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Rank */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                ${index === 0 ? 'bg-orange-500 text-black' : 
                  index === 1 ? 'bg-gray-600 text-white' : 
                  index === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-lg truncate">{seller.businessName}</h3>
                  {seller.isOnline && <span className="w-2 h-2 bg-green-500 rounded-full"/>}
                </div>
                <p className="text-gray-400 text-sm truncate">{seller.address}</p>
                
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-orange-400 font-bold">₦{seller.pricePerKg?.toLocaleString()}/kg</span>
                  <span className="text-gray-500 text-xs bg-gray-800 px-2 py-1 rounded">{seller.availableSizes?.join(', ')}</span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs">
                  {location && seller.location && (
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
