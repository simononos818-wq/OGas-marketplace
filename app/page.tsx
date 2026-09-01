'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, MapPin, Search, Navigation } from 'lucide-react';
import { useLocation } from './hooks/useLocation';
import { useSellers } from './hooks/useSellers';

const TOWNS = ['Ughelli', 'Warri', 'Asaba', 'Lokoja', 'Benin', 'Lagos', 'Port Harcourt', 'Abuja'];

export default function HomePage() {
  const { location, loading: locLoading } = useLocation();
  const hasGps = !!(location && !location.error && location.lat && location.lng);
  const { sellers, loading } = useSellers(
    hasGps ? location!.lat : undefined,
    hasGps ? location!.lng : undefined,
  );
  const [search, setSearch] = useState('');

  const list = sellers.filter((s) => {
    if (s.id.startsWith('seed_')) return false;
    const price = Number(s.pricePerKg || 0);
    if (price > 0 && (price < 800 || price > 2500)) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const hay = [s.businessName, s.address, s.city, s.state, s.ownerName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });

  return (
    <div className="min-h-dvh bg-black text-white pb-28">
      <header
        className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-gray-900 px-4 pb-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
              <Flame size={18} className="text-black" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 leading-none">OGas marketplace</p>
              <p className="font-bold leading-tight">Find gas near you</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 flex items-center gap-1 max-w-[45%] truncate">
            <Navigation size={11} className={hasGps ? 'text-green-400' : 'text-gray-600'} />
            {hasGps ? 'Near you' : locLoading ? 'Finding you…' : 'Search any town'}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shop, street or town in Nigeria"
            className="w-full bg-gray-900 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pt-3 no-scrollbar">
          {TOWNS.map((town) => (
            <button
              key={town}
              type="button"
              onClick={() => setSearch(town)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border ${
                search.toLowerCase() === town.toLowerCase()
                  ? 'bg-orange-500 text-black border-orange-500'
                  : 'bg-gray-900 text-gray-300 border-gray-800'
              }`}
            >
              {town}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-3">
        <Link
          href="/seller/register"
          className="block text-center text-sm bg-gray-900 border border-orange-900/60 text-orange-400 rounded-2xl py-3 font-semibold"
        >
          Sell gas on OGas — open a store
        </Link>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <p className="text-center text-orange-400 py-16 animate-pulse">Finding sellers…</p>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="font-medium text-white mb-1">No verified store in that search</p>
            <p className="text-sm mb-4">Clear the town chip or onboard a shop.</p>
            <Link href="/seller/register" className="text-orange-400 font-semibold">
              Open a store
            </Link>
          </div>
        ) : (
          list.map((s) => (
            <Link
              key={s.id}
              href={`/buy/${s.id}`}
              className="flex items-center gap-3 bg-gray-900 rounded-2xl p-3 active:scale-[0.99] transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-500/15 flex items-center justify-center shrink-0">
                <MapPin className="text-orange-400" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold truncate">{s.businessName}</h3>
                  {s.isOnline && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 truncate">{s.address || s.city || s.state}</p>
                <p className="text-sm mt-0.5">
                  <span className="text-orange-400 font-semibold">
                    ₦{(s.pricePerKg || 0).toLocaleString()}/kg
                  </span>
                  {s.distanceKm != null && s.distanceKm < 900 && (
                    <span className="text-gray-500"> · {s.distanceKm < 1 ? `${Math.round(s.distanceKm * 1000)} m` : `${s.distanceKm.toFixed(1)} km`}</span>
                  )}
                  {s.deliveryFee != null && (
                    <span className="text-gray-500"> · delivery ₦{s.deliveryFee}</span>
                  )}
                </p>
              </div>
              <span className="bg-orange-500 text-black font-bold text-sm px-4 py-2 rounded-xl shrink-0">
                Order
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
