'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Store, ShieldCheck, ArrowRight } from 'lucide-react';
import SmartGasCalculator from './components/SmartGasCalculator';
import { useSellers } from './hooks/useSellers';

export default function HomePage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { sellers, loading } = useSellers(coords?.lat ?? null, coords?.lng ?? null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  const visible = sellers.filter((s) => !s.id.startsWith('seed_') && Number(s.pricePerKg) > 0);

  return (
    <div className="bg-black text-white">
      {/* Hero: calculator hooks the buyer */}
      <SmartGasCalculator
        defaultMode="buyer"
        shopName="OGas Marketplace"
        shopArea="Verified LPG sellers near you"
        refillHref="/shops"
      />

      {/* Floating gateway to the marketplace */}
      <a
        href="#sellers"
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-orange-500 text-black font-bold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 whitespace-nowrap"
      >
        <Store size={16} /> Browse sellers near you
      </a>

      {/* Marketplace feed */}
      <section id="sellers" className="px-4 pb-10 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShieldCheck size={18} className="text-orange-400" />
            Verified sellers {coords ? 'near you' : 'on OGas'}
          </h2>
          <Link href="/shops" className="text-xs text-orange-400 font-semibold flex items-center gap-1">
            See all <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-orange-400 py-10 animate-pulse">Loading sellers…</p>
        ) : visible.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <Store size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              Verified sellers are coming to your area. Check back shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((s) => (
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
                  <p className="text-xs text-gray-500 truncate">
                    {s.address || s.city || s.state}
                    {typeof s.distanceKm === 'number' && s.distanceKm < 900 && (
                      <span className="text-orange-400/80">
                        {' '}· {s.distanceKm < 1 ? `${Math.round(s.distanceKm * 1000)}m` : `${s.distanceKm.toFixed(1)}km`} away
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-orange-400 font-semibold">
                    ₦{Number(s.pricePerKg || 0).toLocaleString()}/kg
                  </p>
                </div>
                <span className="bg-orange-500 text-black font-bold text-sm px-4 py-2 rounded-xl shrink-0">
                  Refill
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Seller acquisition CTA */}
        <Link
          href="/seller/register"
          className="mt-6 flex items-center justify-between bg-orange-500 text-black rounded-2xl p-4 font-bold"
        >
          <span>Own a gas shop? Sell on OGas →</span>
          <Store size={20} />
        </Link>
      </section>
    </div>
  );
}
