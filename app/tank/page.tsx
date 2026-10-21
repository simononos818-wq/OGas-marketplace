'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Flame, Copy, Check, Users, Gift, CreditCard, Loader2, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const TEAL = '#2dd4c2';

interface PointEntry {
  id: string;
  type: 'earn' | 'spend';
  points: number;
  reason: string;
  createdAt?: Date;
}

const REASON_LABELS: Record<string, string> = {
  referral: 'Referral bonus',
  referral_buyer: 'Welcome bonus',
  promo_oct2026: 'October promo · free gas',
  order_discount: 'Order discount',
  order_cashback: 'GasBack · order reward',
  daily_checkin: 'Daily check-in',
};

const REASON_ICONS: Record<string, string> = {
  referral: '🤝',
  referral_buyer: '🎉',
  promo_oct2026: '🎁',
  order_discount: '🔥',
  order_cashback: '💸',
  daily_checkin: '☀️',
};

// 1,500 GP ≈ 1kg of free gas at typical street prices
const KG_GOAL = 1500;

export default function TankPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

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
        const snap = await getDoc(doc(db, 'users', user.uid));
        const gp = Math.floor(Number(snap.data()?.gasPoints) || 0);
        setBalance(Math.max(0, gp));
        setStreak(Number(snap.data()?.checkInStreak) || 0);
        const todayWAT = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
        setCheckedInToday(snap.data()?.lastCheckIn === todayWAT);

        const q = query(collection(db, 'pointsTransactions'), where('uid', '==', user.uid));
        const txSnap = await getDocs(q);
        const rows: PointEntry[] = txSnap.docs.map((d) => {
          const v: any = d.data();
          return {
            id: d.id,
            type: v.type === 'spend' ? 'spend' : 'earn',
            points: Math.floor(Number(v.points) || 0),
            reason: String(v.reason || ''),
            createdAt: v.createdAt?.toDate ? v.createdAt.toDate() : undefined,
          };
        });
        rows.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        setHistory(rows.slice(0, 20));
      } catch {
        /* empty state */
      } finally {
        setLoading(false);
      }
    })();
  }, [authReady, user]);

  const doCheckIn = async () => {
    if (!user || checkinLoading || checkedInToday) return;
    setCheckinLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/points/checkin', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setStreak(data.streak);
        setCheckedInToday(true);
      }
    } catch {
      /* silent — balance stays as-is */
    } finally {
      setCheckinLoading(false);
    }
  };

  const referralLink = useMemo(() => {
    if (!user?.uid) return '';
    return `https://www.ogaslpgmarketplace.com/?ref=${user.uid}`;
  }, [user?.uid]);

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = referralLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Progress toward the next free kg (every 1,500 GP)
  const progress = balance > 0 ? Math.min(1, (balance % KG_GOAL || KG_GOAL) / KG_GOAL) : 0;
  const toNextKg = balance > 0 ? KG_GOAL - (balance % KG_GOAL || 0) : KG_GOAL;
  const fillPct = Math.max(6, Math.round(progress * 100));

  return (
    <div className="min-h-dvh pb-28" style={{ background: 'linear-gradient(180deg,#0b1b38 0%,#10254a 45%,#0e2140 100%)' }}>
      <div className="p-4 max-w-lg mx-auto space-y-4">

        {/* Hero card */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg,#123055 0%,#0d3b4a 100%)',
            border: '1px solid rgba(45,212,194,.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,.35)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={13} color={TEAL} />
            <p className="text-[10px] font-extrabold tracking-widest" style={{ color: TEAL }}>GAS POINTS</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin" size={26} color={TEAL} />
            </div>
          ) : !user ? (
            <div className="text-center py-6">
              <p className="font-extrabold text-white mb-1">Earn free gas</p>
              <p className="text-[12px] mb-4" style={{ color: '#8fa6c9' }}>
                Sign in to collect Gas Points and spend them on refills.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full font-bold py-3 rounded-xl"
                style={{ background: TEAL, color: '#062a2b' }}
              >
                Sign in
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              {/* Tank visual */}
              <div className="shrink-0">
                <svg width="74" height="104" viewBox="0 0 74 104">
                  <defs>
                    <clipPath id="tankClip">
                      <rect x="6" y="18" width="62" height="80" rx="14" />
                    </clipPath>
                    <linearGradient id="gpFill" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#0e8f8a" />
                      <stop offset="100%" stopColor="#2dd4c2" />
                    </linearGradient>
                  </defs>
                  {/* valve */}
                  <rect x="31" y="2" width="12" height="10" rx="3" fill="#3a5578" />
                  <rect x="27" y="10" width="20" height="8" rx="3" fill="#4a6890" />
                  {/* body */}
                  <rect x="6" y="18" width="62" height="80" rx="14" fill="#122c52" stroke="#3d5a85" strokeWidth="2" />
                  {/* liquid */}
                  <g clipPath="url(#tankClip)">
                    <rect
                      x="6"
                      y={18 + (80 * (100 - fillPct)) / 100}
                      width="62"
                      height={(80 * fillPct) / 100}
                      fill="url(#gpFill)"
                    />
                    <ellipse cx="37" cy={18 + (80 * (100 - fillPct)) / 100} rx="31" ry="5" fill="#5eeadb" opacity="0.6" />
                  </g>
                  {/* shine */}
                  <rect x="14" y="26" width="7" height="52" rx="3.5" fill="#ffffff" opacity="0.08" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-black text-white" style={{ fontSize: 38, lineHeight: 1 }}>
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-[12px] font-extrabold" style={{ color: TEAL }}>GP</span>
                </div>
                <p className="text-[12px] font-bold mt-1" style={{ color: '#c9d9e6' }}>
                  = ₦{balance.toLocaleString()} of free gas
                </p>
                <p className="text-[10.5px] mt-2" style={{ color: '#8fa6c9' }}>
                  {balance >= KG_GOAL
                    ? `You have ${Math.floor(balance / KG_GOAL)}kg of free gas in points`
                    : `${toNextKg.toLocaleString()} GP to your next free kg`}
                </p>
              </div>
            </div>
          )}

          {user && !loading && (
            <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
              <p className="text-[10.5px]" style={{ color: '#8fa6c9' }}>
                1 GP = ₦1 · spend up to 10% off any order
              </p>
              <Link href="/buy" className="flex items-center gap-1 text-[11px] font-extrabold" style={{ color: TEAL }}>
                Spend now <ChevronRight size={13} />
              </Link>
            </div>
          )}
        </div>

        {user && !loading && (
          <>
            {/* Daily check-in */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Flame size={15} color={TEAL} />
                <p className="text-[13px] font-extrabold text-white">Daily check-in</p>
                {streak > 0 && (
                  <span className="ml-auto text-[10.5px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,166,35,.15)', color: '#f5a623' }}>
                    {streak}-day streak
                  </span>
                )}
              </div>
              <p className="text-[11px] mb-3" style={{ color: '#8fa6c9' }}>
                Open the app every day and your tank grows. Longer streaks pay more — every 7th day is a +50 GP bonus.
              </p>
              <button
                onClick={doCheckIn}
                disabled={checkinLoading || checkedInToday}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-[13px]"
                style={{
                  background: checkedInToday ? 'rgba(255,255,255,.12)' : TEAL,
                  color: checkedInToday ? '#8fa6c9' : '#062a2b',
                  transition: 'background .2s',
                }}
              >
                {checkinLoading ? <Loader2 size={16} className="animate-spin" /> : checkedInToday ? <Check size={16} /> : <Flame size={16} />}
                {checkedInToday ? 'Collected — come back tomorrow' : 'Collect today’s Gas Points'}
              </button>
            </div>

            {/* Invite card */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Users size={15} color={TEAL} />
                <p className="text-[13px] font-extrabold text-white">Invite a friend — you both get 300 GP</p>
              </div>
              <p className="text-[11px] mb-3" style={{ color: '#8fa6c9' }}>
                When they make their first order, 300 GP enters your tank and theirs.
              </p>
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-[13px]"
                style={{
                  background: copied ? '#0fa958' : TEAL,
                  color: '#062a2b',
                  transition: 'background .2s',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Link copied — share it!' : 'Copy my invite link'}
              </button>
            </div>

            {/* How to earn */}
            <div className="rounded-2xl p-4 space-y-2.5" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
              <p className="text-[13px] font-extrabold text-white mb-1">How to earn</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(45,212,194,.12)' }}>
                  <Users size={16} color={TEAL} />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-white">Invite friends</p>
                  <p className="text-[10.5px]" style={{ color: '#8fa6c9' }}>Their first order pays you both</p>
                </div>
                <span className="text-[12px] font-black" style={{ color: TEAL }}>+300 GP</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,166,35,.12)' }}>
                  <Gift size={16} color="#f5a623" />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-white">October promo</p>
                  <p className="text-[10.5px]" style={{ color: '#8fa6c9' }}>Order 5kg+ before Oct 31</p>
                </div>
                <span className="text-[12px] font-black" style={{ color: '#f5a623' }}>+500 GP</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(45,212,194,.12)' }}>
                  <Flame size={16} color={TEAL} />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-white">GasBack on every order</p>
                  <p className="text-[10.5px]" style={{ color: '#8fa6c9' }}>Pay online, get 2% back in GP — spending earns too</p>
                </div>
                <span className="text-[12px] font-black" style={{ color: TEAL }}>+2%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(45,212,194,.12)' }}>
                  <CreditCard size={16} color={TEAL} />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-white">Spend at checkout</p>
                  <p className="text-[10.5px]" style={{ color: '#8fa6c9' }}>Toggle Gas Points when you pay online</p>
                </div>
                <span className="text-[12px] font-black" style={{ color: TEAL }}>−10%</span>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                <p className="text-[13px] font-extrabold text-white mb-2.5">History</p>
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center gap-3">
                      <span className="text-[15px]">{REASON_ICONS[h.reason] || <Flame size={15} color={TEAL} />}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-white truncate">
                          {REASON_LABELS[h.reason] || 'Gas Points'}
                        </p>
                        {h.createdAt && (
                          <p className="text-[10px]" style={{ color: '#8fa6c9' }}>
                            {h.createdAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                      <span
                        className="text-[12px] font-black"
                        style={{ color: h.type === 'earn' ? '#2dd4c2' : '#f5a623' }}
                      >
                        {h.type === 'earn' ? '+' : '−'}{h.points.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
