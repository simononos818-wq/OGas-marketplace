'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, ShieldCheck, Star, Clock, Bike, Flame, Search, Home, Receipt, MessageCircle, User, ChevronRight, Bell, Navigation, Store, Users } from 'lucide-react';
import { useSellers } from './hooks/useSellers';
import SafetyTips from '@/components/SafetyTips';
import LaunchBanner from './components/launch-banner';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

type SortMode = 'nearest' | 'cheapest' | 'fastest';
type LocState = 'idle' | 'loading' | 'granted' | 'denied';

export default function HomePage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locState, setLocState] = useState<LocState>('idle');
  const [browseAll, setBrowseAll] = useState(false);
  const [sort, setSort] = useState<SortMode>('nearest');
  const [uid, setUid] = useState<string | null>(null);
  const [hasFilled, setHasFilled] = useState(false);
  const { sellers, loading } = useSellers(coords?.lat ?? null, coords?.lng ?? null);

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocState('denied'); return; }
    setLocState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocState('granted'); },
      () => setLocState('denied'),
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u ? u.uid : null);
      if (!u) setHasFilled(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const q = query(collection(db, 'orders'), where('buyerId', '==', uid), limit(1));
        const snap = await getDocs(q);
        setHasFilled(!snap.empty);
      } catch { /* keep FILL */ }
    })();
  }, [uid]);

  const visible = useMemo(
    () => sellers.filter((s) => !s.id.startsWith('seed_') && Number(s.pricePerKg) > 0),
    [sellers]
  );

  const sorted = useMemo(() => {
    const arr = [...visible];
    if (sort === 'cheapest') arr.sort((a, b) => Number(a.pricePerKg) - Number(b.pricePerKg));
    else arr.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    return arr;
  }, [visible, sort]);

  const best = visible.length
    ? visible.reduce((a, b) => (Number(a.pricePerKg) <= Number(b.pricePerKg) ? a : b))
    : null;

  const fmtKm = (d?: number) =>
    typeof d === 'number' && d < 900 ? (d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`) : null;

  const eta = (d?: number) => (typeof d === 'number' && d >= 0 && d < 100) ? `~${15 + Math.round(d * 30)} min` : null;

  const gated = !browseAll && locState !== 'granted';
  const shareMsg = '🔥 Sell gas? Join OGas — the LPG marketplace. 90 days FREE: ₦0 commission, keep 100% of every sale. List your shop: https://ogaslpgmarketplace.com/seller/register';

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

      <main className="px-3 pt-3">

        {/* ===== LOCATION GATE ===== */}
        {gated && (
          <>
            <div className="rounded-2xl p-5 mb-3 text-center"
              style={{ background: `linear-gradient(135deg, ${NAVY}, #245089)`, boxShadow: '0 6px 16px rgba(22,48,94,.25)' }}>
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3"
                style={{ background: 'rgba(255,255,255,.14)' }}>
                <Flame size={28} color="#2dd4c2" />
              </div>
              <h2 className="text-white font-black text-[18px] tracking-wide">LPG NEAR YOU</h2>
              <p className="text-[11px] mt-1 mb-4" style={{ color: '#9fb4d8' }}>
                See verified gas sellers around you with live per-kg prices
              </p>
              <button onClick={requestLocation}
                className="w-full text-white font-extrabold text-[14px] py-3 rounded-xl flex items-center justify-center gap-2"
                style={{ background: TEAL, boxShadow: '0 4px 12px rgba(18,165,176,.4)' }}>
                <Navigation size={15} />
                {locState === 'loading' ? 'Finding your area…' : locState === 'denied' ? 'Try location again' : 'Use my location'}
              </button>
              <p className="text-[9px] mt-2.5" style={{ color: '#7e96b8' }}>
                We only use your location to find the closest LPG. Nothing else.
              </p>
              {locState === 'denied' && (
                <button onClick={() => setBrowseAll(true)}
                  className="mt-3 text-[11px] font-bold underline" style={{ color: '#2dd4c2' }}>
                  Or browse all sellers instead →
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                ['🛡️', 'Verified', 'sellers only'],
                ['⚖️', 'Weighed', 'receipts always'],
                ['🔥', 'Live LPG', 'per-kg prices'],
              ].map(([ic, t, d]) => (
                <div key={t} className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
                  <div className="text-[18px] mb-1">{ic}</div>
                  <div className="text-[10.5px] font-extrabold" style={{ color: "#16305e" }}>{t}</div>
                  <div className="text-[8.5px]" style={{ color: '#8a8f98' }}>{d}</div>
                </div>
              ))}
            </div>

            <div className="mb-3">
              <SafetyTips />
            </div>
          </>
        )}

        {/* ===== SELLERS VIEW ===== */}
        {!gated && (
          <>
            {loading ? (
              <div className="space-y-2.5">
                {[0, 1, 2].map((i) => <div key={i} className="h-[104px] bg-white rounded-2xl animate-pulse" />)}
              </div>
            ) : sorted.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center mb-3" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3"
                  style={{ background: '#e6f7f8' }}>
                  <Store size={26} color="#12a5b0" />
                </div>
                <h3 className="font-black text-[15px] mb-1" style={{ color: "#16305e" }}>No verified LPG seller near you yet</h3>
                <p className="text-[11px] mb-4" style={{ color: '#8a8f98' }}>
                  We are expanding fast across Nigeria. Help us bring gas closer to your street:
                </p>
                <Link href="/seller/register"
                  className="w-full flex items-center justify-center gap-2 text-white font-extrabold text-[13px] py-3 rounded-xl mb-2"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, #245089)`, boxShadow: '0 4px 12px rgba(22,48,94,.3)' }}>
                  <Store size={15} /> I sell gas — List my shop FREE
                </Link>
                <a href={'https://wa.me/?text=' + encodeURIComponent(shareMsg)} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 font-extrabold text-[13px] py-3 rounded-xl"
                  style={{ background: '#e7f9ee', color: '#0fa958', border: '1.5px solid #bfe9cf' }}>
                  <Users size={15} /> I know a seller — Refer them
                </a>
                <p className="text-[9px] mt-3" style={{ color: '#8a8f98' }}>
                  Sellers: ₦0 commission for 90 days · Referrers earn ₦300
                </p>
              </div>
            ) : (
              <>
                {/* BUY GAS */}
                <Link href={best ? `/buy/${best.id}` : '/shops'}
                  className="w-full flex items-center gap-3 rounded-2xl p-3.5 mb-3"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, #245089)`, boxShadow: '0 6px 16px rgba(22,48,94,.25)' }}>
                  <span className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,.14)' }}>
                    <Flame size={22} color="#fff" />
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block text-white font-black text-[16px] tracking-wide">BUY GAS</span>
                    <span className="block text-[10px] mt-0.5" style={{ color: '#9fb4d8' }}>
                      {sorted.length} verified seller{sorted.length === 1 ? '' : 's'} near you
                    </span>
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

                <div className="mb-3">
                  <SafetyTips />
                </div>

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
                <div className="space-y-2.5">
                  {sorted.map((s) => {
                    const km = fmtKm(s.distanceKm);
                    return (
                      <div key={s.id} className="bg-white rounded-2xl p-3" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg,#e6f7f8,#d2f0f2)' }}>
                            <Flame size={18} color="#12a5b0" />
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
                              {eta(s.distanceKm) && <><Clock size={9} /> {eta(s.distanceKm)} ·</>}
                              <span style={{ color: '#0fa958', fontWeight: 700 }}>OPEN</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[14px] font-black" style={{ color: "#16305e" }}>₦{Number(s.pricePerKg).toLocaleString()}</div>
                            <div className="text-[8.5px] font-semibold" style={{ color: '#8a8f98' }}>LPG per kg</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t" style={{ borderColor: '#f0f2f5' }}>
                          <span className="text-[9.5px] font-semibold flex items-center gap-1" style={{ color: '#5b616b' }}>
                            <Bike size={11} /> Delivery fee at checkout
                          </span>
                          <Link href={`/buy/${s.id}`}
        {/* CALCULATE */}
        <Link href="/calculator"
          className="w-full flex items-center gap-3 rounded-2xl p-3.5 mb-3 bg-white"
          style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
          <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#e6f7f8' }}>
            <Calculator size={22} color="#12a5b0" />
          </span>
          <span className="flex-1 text-left">
            <span className="block font-black text-[16px] tracking-wide" style={{ color: "#16305e" }}>CALCULATE</span>
            <span className="block text-[10px] mt-0.5" style={{ color: '#8a8f98' }}>Cost - kg to litres - profit</span>
          </span>
          <ChevronRight size={18} color="#9aa0a8" />
        </Link>

                            className="text-white text-[11px] font-extrabold px-4 py-2 rounded-[10px] flex items-center gap-1"
                            style={{ background: `linear-gradient(135deg, ${NAVY}, #245089)`, boxShadow: '0 3px 8px rgba(22,48,94,.35)', border: '1.5px solid rgba(45,212,194,.5)' }}>
                            <Flame size={11} color="#2dd4c2" /> {hasFilled ? 'REFILL NOW' : 'FILL NOW'}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <LaunchBanner />

      {/* ===== BOTTOM NAV ===== */}
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
