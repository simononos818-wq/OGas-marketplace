'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Store, ShieldCheck, ArrowRight, User } from 'lucide-react';
import { BOTTLE_SIZES, DEFAULT_PRICE_PER_KG, SCALE_STEP, moneyToKg, naira } from '@/lib/gasCalculator';
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
  const best = visible.length
    ? visible.reduce((a, b) => (Number(a.pricePerKg) <= Number(b.pricePerKg) ? a : b))
    : null;
  const price = Number(best?.pricePerKg) > 0 ? Number(best.pricePerKg) : DEFAULT_PRICE_PER_KG;

  return (
    <div className="min-h-dvh bg-black text-white">
      <header
        className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-gray-900 px-4 pb-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <img src="/ogas-icon.svg" alt="OGas" className="w-9 h-9 rounded-full bg-white object-cover" />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold leading-none">OGas</h1>
            <p className="text-xs text-gray-500 mt-1">Verified cooking gas sellers</p>
          </div>
          <Link href="/profile" className="w-9 h-9 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400">
            <User size={17} />
          </Link>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-6">
        <RefillCard pricePerKg={price} orderHref={best ? `/buy/${best.id}` : '/shops'} sellerName={best?.businessName} />

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <ShieldCheck size={17} className="text-orange-400" />
              Verified sellers {coords ? 'near you' : ''}
            </h2>
            <Link href="/shops" className="text-xs text-orange-400 font-semibold flex items-center gap-1">
              See all <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 bg-gray-900 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl p-6 text-center">
              <Store size={28} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No verified sellers here yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((s) => (
                <Link key={s.id} href={`/buy/${s.id}`} className="flex items-center gap-3 bg-gray-900 rounded-2xl p-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/15 flex items-center justify-center shrink-0">
                    <MapPin className="text-orange-400" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{s.businessName}</h3>
                    <p className="text-xs text-gray-500 truncate">
                      {s.address || s.city || s.state}
                      {typeof s.distanceKm === 'number' && s.distanceKm < 900 && (
                        <span className="text-orange-400/80"> · {s.distanceKm < 1 ? `${Math.round(s.distanceKm * 1000)}m` : `${s.distanceKm.toFixed(1)}km`}</span>
                      )}
                    </p>
                    <p className="text-sm text-orange-400 font-semibold">₦{Number(s.pricePerKg || 0).toLocaleString()}/kg</p>
                  </div>
                  <span className="bg-orange-500 text-black font-bold text-sm px-4 py-2 rounded-xl shrink-0">Refill</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Link href="/seller/register" className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl p-4 font-bold">
          <span>Own a gas shop? <span className="text-orange-400">Sell on OGas</span></span>
          <ArrowRight size={18} className="text-orange-400" />
        </Link>
      </div>
    </div>
  );
}

function RefillCard({ pricePerKg, orderHref, sellerName }: { pricePerKg: number; orderHref: string; sellerName?: string }) {
  const [tab, setTab] = useState<'amount' | 'size'>('amount');
  const [money, setMoney] = useState('3000');
  const [size, setSize] = useState(12);

  const cash = Number(String(money).replace(/[^0-9.]/g, '')) || 0;
  const moneyFill = moneyToKg(cash, pricePerKg);
  const fillKg = tab === 'amount' ? moneyFill.kg : size;
  const gasCost = tab === 'amount' ? moneyFill.gasCost : Math.round(pricePerKg * size);
  const change = tab === 'amount' ? moneyFill.change : 0;

  return (
    <div className="bg-gray-900 rounded-3xl p-4 space-y-4">
      <div className="flex bg-black rounded-2xl p-1">
        <button type="button" onClick={() => setTab('amount')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${tab === 'amount' ? 'bg-orange-500 text-black' : 'text-gray-400'}`}>Amount</button>
        <button type="button" onClick={() => setTab('size')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${tab === 'size' ? 'bg-orange-500 text-black' : 'text-gray-400'}`}>Cylinder size</button>
      </div>

      {tab === 'amount' ? (
        <div className="flex items-center bg-black rounded-2xl px-4 py-3">
          <span className="text-2xl font-bold text-gray-500 mr-2">₦</span>
          <input inputMode="numeric" value={money} onChange={(e) => setMoney(e.target.value)} className="flex-1 bg-transparent text-3xl font-bold outline-none placeholder-gray-700" placeholder="0" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {BOTTLE_SIZES.map((sz) => (
            <button key={sz} type="button" onClick={() => setSize(sz)} className={`p-3 rounded-xl border-2 text-left ${size === sz ? 'border-orange-500 bg-orange-500/10' : 'border-gray-800 bg-black'}`}>
              <div className="font-bold">{sz}kg</div>
              <div className="text-xs text-gray-500">{naira(Math.round(pricePerKg * sz))}</div>
            </button>
          ))}
        </div>
      )}

      <div className="bg-orange-500 text-black rounded-2xl p-4">
        {fillKg >= SCALE_STEP ? (
          <>
            <p className="text-4xl font-black leading-tight">{fillKg.toFixed(2)} kg</p>
            <p className="mt-1 font-semibold opacity-80">
              {naira(gasCost)}{change > 0 ? ` · change ${naira(change)}` : ''}
            </p>
          </>
        ) : (
          <p className="font-semibold">Minimum fill is {naira(Math.round(pricePerKg * SCALE_STEP))}</p>
        )}
      </div>

      <Link href={orderHref} className="block text-center bg-white text-black font-bold py-4 rounded-2xl">Order refill</Link>
      <p className="text-center text-xs text-gray-500">{naira(pricePerKg)}/kg{sellerName ? ` · ${sellerName}` : ''}</p>
    </div>
  );
}
