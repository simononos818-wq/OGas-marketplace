'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, ShieldCheck, Star, Clock, Bike, Flame, Search, Home, Receipt, MessageCircle, User, ChevronRight, Bell } from 'lucide-react';
import { DEFAULT_PRICE_PER_KG } from '@/lib/gasCalculator';
import { useSellers } from './hooks/useSellers';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

type SortMode = 'nearest' | 'cheapest' | 'fastest';

export default function HomePage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sort, setSort] = useState<SortMode>('nearest');
  const { sellers, loading } = useSellers(coords?.lat ?? null, coords?.lng ?? null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  const visible = useMemo(
    () => sellers.filter((s) => !s.id.startsWith('seed_') && Number(s.pricePerKg) > 0),
    [sellers]
  );

  const sorted = useMemo(() => {
    const arr = [...visible];
    if (sort === 'cheapest') arr.sort((a, b) => Number(a.pricePerKg) - Number(b.pricePerKg));
    else arr.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999)); // nearest & fastest both distance-based for now
    return arr;
  }, [visible, sort]);

  const best = visible.length
    ? visible.reduce((a, b) => (Number(a.pricePerKg) <= Number(b.pricePerKg) ? a : b))
    : null;

  const fmtKm = (d?: number) =>
    typeof d === 'number' && d < 900 ? (d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`) : null;

  const eta = (d?: number) => `~${15 + Math.round((d ?? 1) * 30)} min`;

  return (
    <div className="min-h-dvh bg-[#f4f6f8] pb-20" style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 px-4 pt-3 pb-3" style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)` }}>
        <div className="flex items-center gap-2.5">
          <img src="/ogas-icon.svg" alt="OGas" className="w-9 h-9 rounded-full bg-white object-cover" />
          <div>
            <div className="text-white font-extrabold text-[15px] leading-none">OGas</div>
            <div className="text-[8px] font-semibold tracking-[1.2px] mt-0.5" style={{ color: '#8fa6c9' }}>ONLINE GAS REFILL</div>
          </div>
          <button className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{ background: 'rgba(255,255,255,.12)' }}>
            <MapPin size={12} color="#fff" />
            <span className="text-left">
              <span className="block text-[10.5px] font-bold text-white leading-none">
                {coords ? 'Near you' : 'Set location'}
              </span>
              <span className="block text-[8px] mt-0.5" style={{ color: '#8fa6c9' }}>
                {coords ? 'Ughelli, Delta ▾' : 'Tap to choose ▾'}
              </span>
            </span>
          </button>
          <Link href="/orders" className="relative p-1">
            <Bell size={17} color="#fff" />
          </Link>
        </div>
      </header>

      {/* ===== MAP STRIP (decorative pins, no API key needed) ===== */}
      <div className="relative h-[120px] overflow-hidden" style={{ background: '#e8eef2' }}>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 330 120">
          <path d="M0 25 L330 12 M0 68 L330 55 M0 105 L330 92 M65 0 L55 120 M155 0 L165 120 M255 0 L245 120"
            stroke="#d8e2ea" strokeWidth="9" fill="none" />
          <path d="M0 68 L330 55 M155 0 L165 120" stroke="#fff" strokeWidth="4" fill="none" />
        </svg>
        {sorted.slice(0, 4).map((s, i) => {
          const pos = [{ left: '30%', top: '20%' }, { left: '62%', top: '48%' }, { left: '18%', top: '58%' }, { left: '78%', top: '18%' }][i];
          return (
            <Link key={s.id} href={`/buy/${s.id}`} className="absolute flex flex-col items-center" style={pos as any}>
              <span className="text-[9px] font-extrabold text-white px-2 py-0.5 rounded-lg shadow"
                style={{ background: i % 2 ? TEAL : NAVY }}>
                ₦{Number(s.pricePerKg).toLocaleString()}/kg
              </span>
              <span className="w-2.5 h-2.5 rounded-full border-2 border-white shadow mt-0.5"
                style={{ background: i % 2 ? TEAL : NAVY }} />
            </Link>
          );
        })}
        <div className="absolute top-2 left-2.5 rounded-lg px-2.5 py-1 text-[9px] font-bold text-white"
          style={{ background: 'rgba(22,48,94,.92)' }}>
          {sorted.length} verified seller{sorted.length === 1 ? '' : 's'} near you
        </div>
      </div>

      {/* ===== BODY ===== */}
      <main className="px-3 pt-3">

        {/* BUY GAS */}
        <Link href={best ? `/buy/${best.id}` : '/shops'}
          className="w-full flex items-center gap-3 rounded-2xl p-3.5 mb-3"
          style={{ background: `linear-gradient(135deg, ${NAVY}, #245089)`, boxShadow: '0 6px 16px rgba(22,48,94,.25)' }}>
          <span className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px]"
            style={{ background: 'rgba(255,255,255,.14)' }}>
            <Flame size={22} color="#fff" />
          </span>
          <span className="flex-1 text-left">
            <span className="block text-white font-black text-[16px] tracking-wide">BUY GAS</span>
            <span className="block text-[10px] mt-0.5" style={{ color: '#9fb4d8' }}>Refill your cylinder in 3 taps</span>
          </span>
          <span className="text-white text-[11px] font-extrabold px-4 py-2 rounded-xl flex items-center gap-1"
            style={{ background: TEAL, boxShadow: '0 3px 8px rgba(18,165,176,.4)' }}>
            Start <ChevronRight size={13} />
          </span>
        </Link>

        {/* SEARCH */}
        <Link href="/shops"
          className="flex items-center gap-2 bg-white rounded-xl px-3.5 py-2.5 mb-3 text-[12px]"
          style={{ color: '#9aa0a8', boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
          <Search size={14} /> Search gas sellers near you
        </Link>

        {/* SORT PILLS */}
        <div className="flex gap-1.5 mb-3">
          {([['nearest', '📍 Nearest'], ['cheapest', '💰 Cheapest'], ['fastest', '⚡ Fastest']] as const).map(([mode, label]) => (
            <button key={mode} onClick={() => setSort(mode)}
              className="text-[10px] font-bold px-3 py-1.5 rounded-[13px]"
              style={sort === mode
                ? { background: NAVY, color: '#fff' }
                : { background: '#fff', color: '#5b616b', border: '1px solid #e6e9ee' }}>
              {label}
            </button>
          ))}
        </div>

        {/* SELLER CARDS */}
        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => <div key={i} className="h-[104px] bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-2xl mb-2">😔</div>
            <p className="text-[12px]" style={{ color: '#8a8f98' }}>No sellers in your area yet.<br />We are expanding fast — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((s) => {
              const km = fmtKm(s.distanceKm);
              return (
                <div key={s.id} className="bg-white rounded-2xl p-3" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg,#e6f7f8,#d2f0f2)' }}>
                      <Flame size={18} color={TEAL} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12.5px] font-extrabold truncate" style={{ color: '#1a1d23' }}>{s.businessName}</span>
                        <span className="text-[7.5px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                          style={{ background: '#e7f9ee', color: '#0fa958' }}>
                          <ShieldCheck size={8} /> VERIFIED
                        </span>
                      </div>
                      <div className="text-[9.5px] mt-0.5 flex items-center gap-1" style={{ color: '#8a8f98' }}>
                        <Star size={9} fill="#f5a623" color="#f5a623" /> New ·
                        {km && <><MapPin size={9} /> {km} ·</>}
                        <Clock size={9} /> {eta(s.distanceKm)} ·
                        <span style={{ color: '#0fa958', fontWeight: 700 }}>OPEN</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[14px] font-black" style={{ color: NAVY }}>₦{Number(s.pricePerKg).toLocaleString()}</div>
                      <div className="text-[8.5px] font-semibold" style={{ color: '#8a8f98' }}>per kg</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t" style={{ borderColor: '#f0f2f5' }}>
                    <span className="text-[9.5px] font-semibold flex items-center gap-1" style={{ color: '#5b616b' }}>
                      <Bike size={11} /> Delivery fee at checkout
                    </span>
                    <Link href={`/buy/${s.id}`}
                      className="text-white text-[11px] font-extrabold px-5 py-2 rounded-[10px]"
                      style={{ background: TEAL, boxShadow: '0 3px 8px rgba(18,165,176,.35)' }}>
                      ORDER NOW
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ===== BOTTOM NAV =====
          NOTE: if your layout.tsx already renders a bottom nav, DELETE this block */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white flex justify-around pt-2 pb-3 border-t border-[#eee] z-40">
        {[
          ['/', 'Home', <Home key="h" size={18} />],
          ['/orders', 'Orders', <Receipt key="o" size={18} />],
          ['/support', 'Help', <MessageCircle key="c" size={18} />],
          ['/profile', 'Me', <User key="u" size={18} />],
        ].map(([href, label, icon], i) => (
          <Link key={label as string} href={href as string} className="text-center no-underline">
            <div style={{ color: i === 0 ? NAVY : '#9aa0a8' }}>{icon}</div>
            <div className="text-[9px] font-semibold mt-0.5" style={{ color: i === 0 ? NAVY : '#9aa0a8', fontWeight: i === 0 ? 800 : 600 }}>{label}</div>
            {i === 0 && <div className="w-1 h-1 rounded-full mx-auto mt-0.5" style={{ background: TEAL }} />}
          </Link>
        ))}
      </nav>
    </div>
  );
}
