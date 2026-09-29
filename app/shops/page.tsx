'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Flame, ShieldCheck } from 'lucide-react';
import { useSellers } from '../hooks/useSellers';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

const TOWNS = ['Ughelli', 'Warri', 'Asaba', 'Lokoja', 'Benin', 'Lagos', 'Port Harcourt', 'Abuja'];

export default function ShopsPage() {
  const { sellers, loading } = useSellers();
  const [search, setSearch] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [hasFilled, setHasFilled] = useState(false);

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
    <div className="min-h-dvh bg-[#f4f6f8] pb-28" style={{ maxWidth: 480, margin: '0 auto' }}>
      <header
        className="sticky top-0 z-40 px-4 pb-3"
        style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)`, paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <img src="/ogas-logo.png" alt="OGas" className="w-8 h-8 rounded-full bg-white object-cover" />
          <div>
            <p className="text-[10px] font-semibold" style={{ color: '#8fa6c9' }}>OGas · LPG Marketplace</p>
            <h1 className="font-bold text-lg text-white leading-none">LPG Shops</h1>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#8a8f98' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Shop, street or town"
            className="w-full bg-white rounded-2xl pl-10 pr-4 py-3 text-sm outline-none"
            style={{ color: NAVY }}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pt-3 no-scrollbar">
          {TOWNS.map((town) => (
            <button
              key={town}
              type="button"
              onClick={() => setSearch(search.toLowerCase() === town.toLowerCase() ? '' : town)}
              className="shrink-0 text-[10.5px] font-bold px-3 py-1.5 rounded-[13px]"
              style={search.toLowerCase() === town.toLowerCase()
                ? { background: TEAL, color: '#fff' }
                : { background: 'rgba(255,255,255,.12)', color: '#c9d9e6' }}
            >
              {town}
            </button>
          ))}
        </div>
      </header>

      <div className="px-3 pt-4 space-y-2.5">
        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => <div key={i} className="h-[76px] bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-2xl mb-2">😔</div>
            <p className="text-[12px]" style={{ color: '#8a8f98' }}>No shop for that search.</p>
          </div>
        ) : (
          list.map((s) => (
            <Link
              key={s.id}
              href={`/buy/${s.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-3"
              style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#e6f7f8,#d2f0f2)' }}>
                <Flame size={18} color={TEAL} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-[13px] truncate" style={{ color: '#1a1d23' }}>{s.businessName}</h3>
                  <ShieldCheck size={10} color="#0fa958" />
                </div>
                <p className="text-[10px] truncate" style={{ color: '#8a8f98' }}>{s.address || s.city || s.state}</p>
                <p className="text-[13px] font-black" style={{ color: NAVY }}>
                  ₦{(s.pricePerKg || 0).toLocaleString()} <span className="text-[9px] font-semibold" style={{ color: '#8a8f98' }}>LPG /kg</span>
                </p>
              </div>
              <span className="text-white font-extrabold text-[11px] px-4 py-2 rounded-[10px] flex items-center gap-1 shrink-0"
                style={{ background: `linear-gradient(135deg, ${NAVY}, #245089)`, boxShadow: '0 3px 8px rgba(22,48,94,.35)', border: '1.5px solid rgba(45,212,194,.5)' }}>
                <Flame size={11} color="#2dd4c2" /> {hasFilled ? 'REFILL' : 'FILL'}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
