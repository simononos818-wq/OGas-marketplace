'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Search } from 'lucide-react';
import { useSellers } from '../hooks/useSellers';

const TOWNS = ['Ughelli', 'Warri', 'Asaba', 'Lokoja', 'Benin', 'Lagos', 'Port Harcourt', 'Abuja'];

export default function ShopsPage() {
  const { sellers, loading } = useSellers();
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
        <p className="text-[11px] text-gray-500">Inside OGas</p>
        <h1 className="font-bold text-lg mb-3">Shops</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Shop, street or town"
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

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <p className="text-center text-orange-400 py-16 animate-pulse">Loading shops…</p>
        ) : list.length === 0 ? (
          <p className="text-center py-16 text-gray-500">No shop for that search.</p>
        ) : (
          list.map((s) => (
            <Link
              key={s.id}
              href={`/buy/${s.id}`}
              className="flex items-center gap-3 bg-gray-900 rounded-2xl p-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-500/15 flex items-center justify-center shrink-0">
                <MapPin className="text-orange-400" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{s.businessName}</h3>
                <p className="text-xs text-gray-500 truncate">{s.address || s.city || s.state}</p>
                <p className="text-sm text-orange-400 font-semibold">
                  ₦{(s.pricePerKg || 0).toLocaleString()}/kg
                </p>
              </div>
              <span className="bg-orange-500 text-black font-bold text-sm px-4 py-2 rounded-xl shrink-0">
                Refill
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
