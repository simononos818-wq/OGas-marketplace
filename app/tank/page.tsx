'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Fuel, Flame, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

// How fast a household burns gas, kg per day (simple presets)
const USAGE_PRESETS = [
  { id: 'light', label: 'Light (cooking only)', kgPerDay: 0.2 },
  { id: 'normal', label: 'Normal (family cooking)', kgPerDay: 0.35 },
  { id: 'heavy', label: 'Heavy (cooking + business)', kgPerDay: 0.7 },
];

export default function TankPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefill, setLastRefill] = useState<{ kg: number; date: Date } | null>(null);
  const [usage, setUsage] = useState(USAGE_PRESETS[1]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('buyerId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const o: any = snap.docs[0].data();
          const kg = Number(o.kgDelivered || o.kg || 0);
          const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          if (kg > 0) setLastRefill({ kg, date: d });
        }
      } catch {
        /* index may not exist yet — show empty state */
      } finally {
        setLoading(false);
      }
    })();
  }, [authReady, user]);

  let pct = 0;
  let kgLeft = 0;
  let daysLeft = 0;
  if (lastRefill) {
    const daysSince = Math.max(0, (Date.now() - lastRefill.date.getTime()) / 86400000);
    kgLeft = Math.max(0, lastRefill.kg - daysSince * usage.kgPerDay);
    pct = Math.min(100, Math.round((kgLeft / lastRefill.kg) * 100));
    daysLeft = usage.kgPerDay > 0 ? Math.floor(kgLeft / usage.kgPerDay) : 0;
  }

  const barColor = pct > 50 ? '#0fa958' : pct > 20 ? '#f59e0b' : '#e74c3c';

  return (
    <div className="min-h-screen pb-28" style={{ background: '#f4f6f8' }}>
      <div className="p-4 max-w-lg mx-auto space-y-5">
        <h1 className="text-xl font-extrabold flex items-center gap-2 pt-2" style={{ color: NAVY }}>
          <Fuel size={24} style={{ color: TEAL }} /> My Tank
        </h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" size={28} style={{ color: TEAL }} />
          </div>
        ) : !user ? (
          <div className="bg-white rounded-2xl p-6 text-center border" style={{ borderColor: '#e6e9ee' }}>
            <Fuel size={40} className="mx-auto mb-3" style={{ color: '#c3cbd4' }} />
            <p className="font-bold mb-4" style={{ color: NAVY }}>Sign in to track your gas level</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full text-white font-bold py-3 rounded-xl"
              style={{ background: TEAL }}
            >
              Sign in
            </button>
          </div>
        ) : !lastRefill ? (
          <div className="bg-white rounded-2xl p-6 text-center border" style={{ borderColor: '#e6e9ee' }}>
            <Fuel size={40} className="mx-auto mb-3" style={{ color: '#c3cbd4' }} />
            <h2 className="font-extrabold mb-1" style={{ color: NAVY }}>No refill tracked yet</h2>
            <p className="text-sm font-bold mb-5" style={{ color: '#8a8f98' }}>
              Once your first OGas order is completed and weighed, your tank level will show here automatically.
            </p>
            <button
              onClick={() => router.push('/buy')}
              className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
              style={{ background: TEAL }}
            >
              <Flame size={18} /> Order your first refill
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#e6e9ee' }}>
              <div className="flex items-end justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: '#8a8f98' }}>Estimated level</span>
                <span className="text-3xl font-extrabold" style={{ color: barColor }}>{pct}%</span>
              </div>
              <div className="w-full h-5 rounded-full overflow-hidden" style={{ background: '#eef1f5' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.max(pct, 4)}%`, background: barColor }}
                />
              </div>
              <div className="flex justify-between mt-3 text-sm font-bold" style={{ color: '#5b616b' }}>
                <span>≈ {kgLeft.toFixed(1)} kg left</span>
                <span>≈ {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining</span>
              </div>
              <p className="text-xs font-bold mt-3" style={{ color: '#8a8f98' }}>
                Last refill: {lastRefill.kg} kg on {lastRefill.date.toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#e6e9ee' }}>
              <p className="text-sm font-extrabold mb-3" style={{ color: NAVY }}>How do you use gas?</p>
              <div className="space-y-2">
                {USAGE_PRESETS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setUsage(u)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold border"
                    style={{
                      background: usage.id === u.id ? `${TEAL}12` : '#fff',
                      borderColor: usage.id === u.id ? TEAL : '#e6e9ee',
                      color: usage.id === u.id ? NAVY : '#5b616b',
                    }}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {pct <= 25 && (
              <div className="rounded-2xl p-4 text-sm font-bold" style={{ background: '#fdeceb', color: '#e74c3c' }}>
                Your gas is running low. Order now before it finishes.
              </div>
            )}

            <Link
              href="/buy"
              className="flex items-center justify-between w-full text-white font-bold px-5 py-4 rounded-2xl"
              style={{ background: NAVY }}
            >
              <span className="flex items-center gap-2"><Flame size={18} /> REFILL NOW</span>
              <ChevronRight size={18} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
