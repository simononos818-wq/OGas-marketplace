'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Search, Flame, ShieldCheck, X, ChevronDown, Sparkles } from 'lucide-react';
import { useSellers, getDistance, extractCoords } from './hooks/useSellers';
import { useAuth } from './context/AuthContext';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TOWNS, DEFAULT_TOWN, townName, type Town } from '@/lib/locations';

const NAVY = '#16305e';
const TEAL = '#12a5b0';
const GREEN = '#0fa958';

export default function HomePage() {
  const { user, profile } = useAuth();
  const { sellers, loading } = useSellers();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [hasFilled, setHasFilled] = useState(false);
  const [town, setTown] = useState<Town>(DEFAULT_TOWN);
  const [showLocation, setShowLocation] = useState(false);
  const [locMode, setLocMode] = useState<'ask' | 'gps' | 'pick'>('ask');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsChecked, setGpsChecked] = useState(false);

  // Read saved town once on mount — also re-read when a town page navigates back
  useEffect(() => {
    const readTown = () => {
      const saved = localStorage.getItem('ogas_town');
      if (saved) {
        const found = TOWNS.find(t => t.name.toLowerCase() === saved.toLowerCase());
        if (found) setTown(found);
      }
    };
    readTown();
    window.addEventListener('focus', readTown);
    return () => window.removeEventListener('focus', readTown);
  }, []);

  // First-time visitors: ask once, then never again
  useEffect(() => {
    if (localStorage.getItem('ogas_loc_done')) return;
    if (profile?.city) {
      const found = TOWNS.find(t => t.name.toLowerCase() === profile.city!.toLowerCase());
      if (found) setTown(found);
      localStorage.setItem('ogas_loc_done', '1');
      return;
    }
    const t = setTimeout(() => setShowLocation(true), 900);
    return () => clearTimeout(t);
  }, [profile]);

  // Check if buyer has ordered before → switches FILL → REFILL
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      try {
        const q = query(collection(db, 'orders'), where('buyerId', '==', user.uid), limit(1));
        const snap = await getDocs(q);
        setHasFilled(!snap.empty);
      } catch { /* keep FILL */ }
    })();
  }, [user?.uid]);

  const dismissLocation = useCallback(() => {
    localStorage.setItem('ogas_loc_done', '1');
    setShowLocation(false);
  }, []);

  const pickTown = useCallback((t: Town) => {
    setTown(t);
    setUserPos(null);
    setGpsChecked(false);
    localStorage.setItem('ogas_town', t.name);
    dismissLocation();
  }, [dismissLocation]);

  const useGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('GPS not available on this device.'); return; }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let nearest = TOWNS[0];
        let minD = Infinity;
        TOWNS.forEach(t => {
          const d = getDistance(lat, lng, t.lat, t.lng);
          if (d < minD) { minD = d; nearest = t; }
        });
        setUserPos({ lat, lng });
        setTown(nearest);
        localStorage.setItem('ogas_town', nearest.name);
        setGpsLoading(false);
        dismissLocation();
      },
      () => {
        setGpsError('Could not get location. Pick your town instead.');
        setGpsLoading(false);
        setLocMode('pick');
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [dismissLocation]);

  // Live towns = only towns with real (non-seed) approved sellers
  const liveTowns = new Set(
    sellers.filter(s => !s.id.startsWith('seed_') && s.city).map(s => s.city!.toLowerCase())
  );

  const filtered = sellers.filter(s => {
    // Never show seed/demo sellers in the live marketplace
    if (s.id.startsWith('seed_')) return false;
    // Town filter — relaxed if no approved sellers in that town yet
    if (s.city && liveTowns.has(town.name.toLowerCase()) && s.city.toLowerCase() !== town.name.toLowerCase()) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      s.businessName.toLowerCase().includes(q) ||
      (s.address || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.state || '').toLowerCase().includes(q) ||
      (s.ownerName || '').toLowerCase().includes(q)
    );
  });

  // Distance sort once GPS has been granted (stable — only computed on first GPS fix)
  const sorted = (userPos && !gpsChecked)
    ? [...filtered].sort((a, b) => {
        const ca = extractCoords(a);
        const cb = extractCoords(b);
        const da = ca ? getDistance(userPos.lat, userPos.lng, ca.lat, ca.lng) : 9999;
        const db = cb ? getDistance(userPos.lat, userPos.lng, cb.lat, cb.lng) : 9999;
        return da - db;
      })
    : filtered;

  const fillWord = hasFilled ? 'REFILL' : 'FILL';

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f8', maxWidth: 480, margin: '0 auto' }}>
      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-40 px-4 pb-3"
        style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1e4078 100%)`, paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <img src="/ogas-logo.png" alt="OGas" className="w-9 h-9 rounded-full bg-white object-cover" />
            <div>
              <h1 className="text-white font-extrabold text-[17px] leading-none tracking-tight">OGas</h1>
              <p className="text-[9px] mt-0.5 font-medium" style={{ color: '#8fa6c9' }}>Online Gas Refill</p>
            </div>
          </div>
          <button
            onClick={() => { setLocMode('pick'); setShowLocation(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <MapPin size={11} color="#2dd4c2" />
            <span className="text-white text-[11px] font-bold">{town.name}</span>
            <ChevronDown size={11} color="#8fa6c9" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: '#8a8f98' }} />
          <input
            type="text"
            placeholder={`Find gas seller in ${town.name}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
            style={{ background: '#fff', color: NAVY, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
          />
        </div>
        <Link href="/assistant" className="mt-2 inline-flex min-h-[32px] items-center gap-1.5 text-[11px] font-bold text-[#2dd4c2]">
          <Sparkles size={13} /> Not sure how much to buy? Ask OGas AI →
        </Link>
      </header>

      {/* ── SELLER LIST ── */}
      <div className="px-3 pt-3 pb-28">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <p className="text-[12px] font-bold" style={{ color: '#5b616b' }}>
            {loading ? 'Finding sellers…' : `${sorted.length} seller${sorted.length !== 1 ? 's' : ''} in ${town.name}`}
          </p>
          <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: GREEN }}>
            <ShieldCheck size={11} /> All verified
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-2xl p-3.5 animate-pulse" style={{ background: '#fff', height: 90 }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😔</div>
            <p className="font-bold text-base" style={{ color: NAVY }}>No sellers found</p>
            <p className="text-sm mt-1" style={{ color: '#8a8f98' }}>
              {search ? 'Try a different search.' : `No approved sellers in ${town.name} yet.`}
            </p>
            {!search && (
              <button onClick={() => { setLocMode('pick'); setShowLocation(true); }} className="mt-4 text-sm font-bold" style={{ color: TEAL }}>
                Change town
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map(seller => (
              <SellerCard key={seller.id} seller={seller} fillWord={fillWord} userPos={userPos} />
            ))}
          </div>
        )}

        {/* Trust strip */}
        {!loading && sorted.length > 0 && (
          <div className="mt-6 rounded-2xl p-4 flex items-start gap-3" style={{ background: '#e6f7f8', border: '1px solid #b2e8ea' }}>
            <ShieldCheck size={20} color={TEAL} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-bold" style={{ color: NAVY }}>Escrow-protected orders</p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#4a7a80' }}>
                Your payment is held until you confirm delivery with your Door Code. Never share it early.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── LOCATION BOTTOM SHEET ── */}
      {showLocation && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="w-full rounded-t-3xl px-5 pt-5 pb-10" style={{ background: '#fff', maxWidth: 480 }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#e0e0e0' }} />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-extrabold text-[18px]" style={{ color: NAVY }}>Your location</h2>
                <p className="text-[12px] mt-0.5" style={{ color: '#8a8f98' }}>Find gas sellers near you</p>
              </div>
              <button onClick={dismissLocation} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#f4f6f8' }}>
                <X size={16} color="#8a8f98" />
              </button>
            </div>

            {locMode !== 'pick' ? (
              <>
                <button
                  onClick={useGPS}
                  disabled={gpsLoading}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl mb-3 text-left"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)` }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(45,212,194,0.15)' }}>
                    {gpsLoading
                      ? <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2dd4c2', borderTopColor: 'transparent' }} />
                      : <MapPin size={22} color="#2dd4c2" />
                    }
                  </div>
                  <div>
                    <p className="text-white font-bold text-[14px]">{gpsLoading ? 'Getting location…' : 'Use my current location'}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#8fa6c9' }}>GPS — finds the closest sellers to you</p>
                  </div>
                </button>
                {gpsError && <p className="text-red-500 text-xs mb-3 px-1">{gpsError}</p>}
                <button
                  onClick={() => setLocMode('pick')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left"
                  style={{ background: '#f4f6f8' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#e6f7f8' }}>
                    <Search size={20} color={TEAL} />
                  </div>
                  <div>
                    <p className="font-bold text-[14px]" style={{ color: NAVY }}>Choose my town</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#8a8f98' }}>Ughelli, Warri, Asaba & more</p>
                  </div>
                </button>
              </>
            ) : (
              <>
                <p className="text-[12px] font-semibold mb-3" style={{ color: '#8a8f98' }}>Select your town</p>
                <div className="grid grid-cols-2 gap-2">
                  {TOWNS.map(t => {
                    const isLive = liveTowns.has(t.name.toLowerCase());
                    const isActive = town.name === t.name;
                    return (
                      <button
                        key={t.name}
                        onClick={() => pickTown(t)}
                        className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: isActive ? NAVY : '#f4f6f8',
                          border: isActive ? `1.5px solid ${NAVY}` : '1.5px solid transparent',
                        }}
                      >
                        <MapPin size={14} color={isActive ? '#2dd4c2' : isLive ? GREEN : '#8a8f98'} />
                        <div>
                          <p className="font-bold text-[13px]" style={{ color: isActive ? '#fff' : NAVY }}>{t.name}</p>
                          <p className="text-[10px]" style={{ color: isActive ? '#8fa6c9' : isLive ? GREEN : '#8a8f98' }}>
                            {isLive ? '● Sellers live' : 'Coming soon'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setLocMode('ask')} className="mt-4 w-full text-center text-[12px] font-semibold py-2" style={{ color: TEAL }}>
                  ← Back
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SELLER CARD — one thumb tap to order ──────────────────────────────
function SellerCard({ seller, fillWord, userPos }: { seller: any; fillWord: string; userPos: { lat: number; lng: number } | null }) {
  const coords = extractCoords(seller);
  const dist = (userPos && coords)
    ? getDistance(userPos.lat, userPos.lng, coords.lat, coords.lng)
    : null;

  return (
    <Link href={`/buy/${seller.id}`} className="block">
      <div
        className="flex items-center gap-3 p-3 rounded-2xl active:scale-[0.98] transition-transform"
        style={{ background: '#fff', boxShadow: '0 2px 8px rgba(20,30,50,0.06)', border: '1px solid #eef0f4' }}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-[52px] h-[52px] rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #e6f7f8, #d2f0f2)' }}
          >
            {seller.image
              ? <img src={seller.image} alt={seller.businessName} className="w-full h-full object-cover rounded-xl" />
              : <Flame size={22} color={TEAL} />
            }
          </div>
          {seller.isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: GREEN }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-extrabold text-[13.5px] truncate" style={{ color: '#1a1d23' }}>{seller.businessName}</p>
            <ShieldCheck size={12} color={GREEN} className="flex-shrink-0" />
          </div>
          <p className="text-[11px] truncate mt-0.5" style={{ color: '#8a8f98' }}>
            {seller.address || seller.city || seller.state}
            {dist !== null ? ` · ${dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}` : ''}
          </p>
          <p className="font-black text-[14px] mt-1" style={{ color: NAVY }}>
            ₦{(seller.pricePerKg || 0).toLocaleString()}
            <span className="font-semibold text-[10px] ml-1" style={{ color: '#8a8f98' }}>LPG /kg</span>
          </p>
        </div>

        {/* FILL / REFILL pill */}
        <div
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-[12px]"
          style={{
            background: `linear-gradient(135deg, ${NAVY}, #245089)`,
            boxShadow: '0 3px 10px rgba(22,48,94,0.35)',
            border: '1.5px solid rgba(45,212,194,0.5)',
          }}
        >
          <Flame size={13} color="#2dd4c2" />
          <span className="text-white font-extrabold text-[11.5px] tracking-wide">{fillWord}</span>
        </div>
      </div>
    </Link>
  );
}
