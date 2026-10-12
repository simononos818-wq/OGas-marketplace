'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/hooks/useAuth';
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight,
  Clock, Loader2, Banknote
} from 'lucide-react';
import Link from 'next/link';

const NAVY = '#16305e';
const TEAL = '#12a5b0';
const MUTED = '#8a8f98';
const BG = '#f4f6f8';

// Change this one string if your referral function uses a different field name
// (check functions-backend/index.js — the walletTransactions writer).
const TX_USER_FIELD = 'userId';

interface Tx {
  id: string;
  amount: number;
  type: string;
  description?: string;
  createdAt: any;
}

function txTag(tx: Tx) {
  const t = (tx.type || '').toLowerCase();
  if (t.includes('commission') || t.includes('fee'))
    return { label: 'FEE', bg: '#f3eefc', color: '#7b4fd0' };
  if (t.includes('payout') || t.includes('withdraw'))
    return { label: 'PAYOUT', bg: '#fdeeee', color: '#c0392b' };
  if (t.includes('prime') || t.includes('subscription'))
    return { label: 'PRIME', bg: '#e8f0fe', color: '#2f6fed' };
  if (t.includes('referral'))
    return { label: 'BONUS', bg: '#e8f0fe', color: '#2f6fed' };
  if (t.includes('walkin') || t.includes('walk-in'))
    return { label: 'WALK-IN', bg: '#fff4e0', color: '#b07800' };
  return { label: 'ORDER', bg: '#e0f2ff', color: '#0a6cbd' };
}

function formatDate(ts: any) {
  return ts?.toDate?.().toLocaleDateString?.() || '';
}

export default function SellerEarningsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [wallet, setWallet] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/seller/login');
    } else if (user) {
      loadData();
    }
  }, [user, loading]);

  const loadData = async () => {
    try {
      const userSnap = await getDoc(doc(db, 'users', user!.uid));
      const data = userSnap.data();
      const bal = data?.walletBalance ?? data?.wallet ?? data?.earnings ?? 0;
      setWallet(bal);

      const q = query(
        collection(db, 'walletTransactions'),
        where(TX_USER_FIELD, '==', user!.uid)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Tx))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        .slice(0, 30);
      setTxs(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || (loadingData && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2" style={{ background: BG, color: NAVY }}>
        <Loader2 className="animate-spin" size={20} />
        <span className="font-bold text-sm">Loading...</span>
      </div>
    );
  }
  if (!user) return null;

  const GOAL = 50000;
  const pct = Math.min(100, Math.round((wallet / GOAL) * 100));

  const earned = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const paidOut = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const filtered = txs.filter((t) =>
    filter === 'all' ? true : filter === 'in' ? t.amount > 0 : t.amount < 0
  );

  return (
    <div className="min-h-screen px-4 pt-4 pb-24" style={{ background: BG }}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/seller/dashboard" className="p-2 bg-white rounded-xl" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
            <ArrowLeft size={18} style={{ color: NAVY }} />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold" style={{ color: NAVY }}>Earnings Tank</h1>
            <p className="text-xs" style={{ color: MUTED }}>Mega Think Success</p>
          </div>
        </div>

        <div className="rounded-2xl p-5 mb-4 text-white" style={{ background: `linear-gradient(150deg, ${NAVY} 0%, #0a2540 70%)`, boxShadow: '0 8px 24px rgba(10,37,64,.28)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-widest" style={{ color: '#a9c3d8' }}>TANK BALANCE</span>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full" style={{ background: 'rgba(18,165,176,.18)', color: '#5ee6df', border: '1px solid rgba(94,230,223,.35)' }}>
              SELLER
            </span>
          </div>
          <p className="text-4xl font-extrabold mt-2 tracking-tight">
            <span className="text-lg font-bold" style={{ color: '#9fd8dd' }}>₦</span>
            {wallet.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: '#a9c3d8' }}>Available for payout</p>

          <div className="mt-5">
            <div className="flex justify-between text-[10px] font-bold mb-1.5" style={{ color: '#a9c3d8' }}>
              <span>TANK LEVEL</span><span>₦{GOAL.toLocaleString()} goal</span>
            </div>
            <div className="h-3.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.12)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,#0fb5a6,#2dd4c2)` }} />
            </div>
            <div className="flex justify-between text-[9px] mt-1" style={{ color: '#6f8ba6' }}>
              <span>₦0</span><span>₦25k</span><span>₦50k</span>
            </div>
          </div>

          <div className="flex gap-2.5 mt-5">
            <Link href="/seller/bank" className="flex-1 text-center py-3.5 rounded-xl font-extrabold text-sm" style={{ background: TEAL, color: '#fff', boxShadow: '0 6px 16px rgba(18,165,176,.35)' }}>
              Withdraw to Bank
            </Link>
            <a href="#activity" className="flex-1 text-center py-3.5 rounded-xl font-extrabold text-sm" style={{ background: 'rgba(255,255,255,.08)', color: '#cfe6ee', border: '1px solid rgba(255,255,255,.18)' }}>
              History
            </a>
          </div>
        </div>

        <div className="rounded-2xl p-4 mb-4 text-white" style={{ background: `linear-gradient(135deg,#0fb5a6 0%, ${TEAL} 100%)`, boxShadow: '0 8px 20px rgba(18,165,176,.28)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold tracking-wide">★ OGAS PRIME</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,.22)' }}>COMING SOON</span>
          </div>
          <p className="text-xs mt-1.5" style={{ color: '#e2fbfa' }}>
            ₦30,000 / month · 0% commission on every order · Unlimited orders
          </p>
          <button
            disabled
            className="w-full mt-3 py-2.5 rounded-xl text-xs font-extrabold opacity-70"
            style={{ background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.35)', color: '#fff' }}
          >
            Opens after your free period
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#e6f7f6' }}>
            <Clock size={18} style={{ color: TEAL }} />
          </div>
          <div>
            <p className="text-[13px] font-extrabold" style={{ color: NAVY }}>Payouts run every morning after settlement</p>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>No fees · Money lands in your saved bank account</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
            <p className="font-extrabold text-sm" style={{ color: '#0e8f86' }}>₦{earned.toLocaleString()}</p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: MUTED }}>Total Earned</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
            <p className="font-extrabold text-sm" style={{ color: NAVY }}>₦{paidOut.toLocaleString()}</p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: MUTED }}>Paid Out</p>
          </div>
        </div>

        <div id="activity" className="flex gap-2 mb-3">
          {([['all', 'All'], ['in', 'Money In'], ['out', 'Money Out']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-4 py-2 rounded-full text-xs font-bold"
              style={
                filter === key
                  ? { background: NAVY, color: '#fff' }
                  : { background: '#fff', color: MUTED, boxShadow: '0 1px 4px rgba(20,30,50,.06)' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        <h2 className="text-xs font-extrabold tracking-wider mb-2" style={{ color: NAVY }}>TANK ACTIVITY</h2>
        {loadingData ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
            <Banknote size={32} style={{ color: '#c3cbd4' }} className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: MUTED }}>No activity yet</p>
            <p className="text-xs mt-1" style={{ color: MUTED }}>Completed orders will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl px-4" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
            {filtered.map((tx, i) => {
              const tag = txTag(tx);
              return (
                <div key={tx.id} className="flex items-center gap-3 py-3.5" style={{ borderBottom: i < filtered.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-sm"
                    style={{ background: tag.bg, color: tag.color }}
                  >
                    {tx.amount > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: NAVY }}>
                      {tx.description || tx.type || 'Activity'}
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ml-1.5" style={{ background: tag.bg, color: tag.color }}>
                        {tag.label}
                      </span>
                    </p>
                    <p className="text-[11px]" style={{ color: MUTED }}>{formatDate(tx.createdAt)}</p>
                  </div>
                  <span className="text-sm font-extrabold whitespace-nowrap" style={{ color: tx.amount > 0 ? '#0e8f86' : '#c0392b' }}>
                    {tx.amount > 0 ? '+' : '−'}₦{Math.abs(tx.amount).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
