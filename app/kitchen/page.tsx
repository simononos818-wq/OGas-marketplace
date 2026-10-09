'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import {
  Flame, Calculator, Lightbulb, Handshake, Fuel, ClipboardList, ShieldCheck,
  ChevronDown, Loader2, Phone, RotateCcw, Users, UtensilsCrossed,
} from 'lucide-react';

const NAVY = '#16305e';
const TEAL = '#12a5b0';
const ASH = '#8a8f98';

const SAFETY_TIPS = [
  'Check your hose for cracks every month — replace it every 2 years.',
  'Always keep your cylinder upright and in a ventilated space.',
  'Smell gas? Do not strike a match or switch anything on. Open windows, close the valve.',
  'Never store your cylinder near direct heat or sunlight.',
  'Soapy water on the valve will bubble if there is a leak — test after every refill.',
  'Turn off the regulator when cooking is done for the day.',
  'Keep children away from the cylinder and burner while cooking.',
];

const CYLINDER_SIZES = [3, 6, 12.5, 25, 50];

type LastRefill = { kg: number; date: Date; price?: number; sellerId?: string; sellerName?: string; sellerPhone?: string };
type SellerRow = { id: string; name: string; price125: number; landmark?: string };

export default function KitchenPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [gasPoints, setGasPoints] = useState(0);
  const [lastRefill, setLastRefill] = useState<LastRefill | null>(null);
  const [recentRefills, setRecentRefills] = useState<LastRefill[]>([]);
  const [sellers, setSellers] = useState<SellerRow[]>([]);

  // Calculator state
  const [people, setPeople] = useState(4);
  const [meals, setMeals] = useState(2);
  const [cylSize, setCylSize] = useState(12.5);

  // Expandable cards
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));

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
        // Profile: name + Gas Points balance
        const uSnap = await getDoc(doc(db, 'users', user.uid));
        if (uSnap.exists()) {
          const u: any = uSnap.data();
          setDisplayName(u.displayName || u.name || '');
          setGasPoints(Math.max(0, Math.floor(Number(u.gasPoints || 0))));
        }

        // Refill history (completed, weighed orders)
        try {
          const q = query(
            collection(db, 'orders'),
            where('buyerId', '==', user.uid),
            where('status', '==', 'completed'),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          const snap = await getDocs(q);
          const rows: LastRefill[] = [];
          for (const d of snap.docs) {
            const o: any = d.data();
            const kg = Number(o.kgDelivered || o.kg || 0);
            if (kg <= 0) continue;
            const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
            const row: LastRefill = {
              kg,
              date,
              price: Number(o.totalAmount || o.amount || 0) || undefined,
              sellerId: o.sellerId,
            };
            if (o.sellerId) {
              try {
                const sSnap = await getDoc(doc(db, 'sellers', o.sellerId));
                if (sSnap.exists()) {
                  const s: any = sSnap.data();
                  row.sellerName = s.businessName;
                  row.sellerPhone = s.phone;
                }
              } catch { /* ignore */ }
            }
            rows.push(row);
          }
          setRecentRefills(rows);
          if (rows.length > 0) setLastRefill(rows[0]);
        } catch {
          /* composite index may not exist yet — hero falls back gracefully */
        }

        // Nearby sellers for price compare (cheapest 3 by 12.5kg price)
        try {
          const sSnap = await getDocs(query(collection(db, 'sellers'), limit(50)));
          const list: SellerRow[] = [];
          sSnap.forEach((d) => {
            const s: any = d.data();
            if (s.isApproved === false || s.isActive === false) return;
            const p = Number(s.prices?.['12.5kg'] || 0);
            if (p > 0 && s.businessName) {
              list.push({ id: d.id, name: s.businessName, price125: p, landmark: s.landmark });
            }
          });
          list.sort((a, b) => a.price125 - b.price125);
          setSellers(list.slice(0, 3));
        } catch { /* ignore */ }
      } finally {
        setLoading(false);
      }
    })();
  }, [authReady, user]);

  // ---- Gas level estimate ----
  const kgPerDay = useMemo(() => people * meals * 0.06, [people, meals]);
  let kgLeft = 0, pct = 0, daysLeft = 0, refillBy = '';
  if (lastRefill) {
    const daysSince = Math.max(0, (Date.now() - lastRefill.date.getTime()) / 86400000);
    kgLeft = Math.max(0, lastRefill.kg - daysSince * kgPerDay);
    pct = Math.min(100, Math.round((kgLeft / lastRefill.kg) * 100));
    daysLeft = kgPerDay > 0 ? Math.floor(kgLeft / kgPerDay) : 0;
    refillBy = new Date(Date.now() + daysLeft * 86400000).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  }

  // Calculator results
  const kgNeeded = Math.max(0, cylSize - kgLeft);
  const refillDays = kgPerDay > 0 ? Math.round(cylSize / kgPerDay) : 0;
  const pricePerKg = sellers.length > 0 ? Math.round(sellers[0].price125 / 12.5) : 1500;
  const estCost = Math.round((kgNeeded * pricePerKg) / 100) * 100;

  const levelColor = pct > 50 ? '#0fa958' : pct > 25 ? '#f59e0b' : '#e74c3c';
  const todayTip = SAFETY_TIPS[new Date().getDate() % SAFETY_TIPS.length];

  // Cylinder visual (SVG)
  const fillH = Math.max(4, Math.min(100, pct));
  const trusted = lastRefill?.sellerName ? lastRefill : null;

  const firstName = displayName ? displayName.split(' ')[0] : '';

  const Card = ({ id, icon: Icon, title, children }: any) => {
    const isOpen = open === id;
    return (
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: isOpen ? TEAL : '#e6e9ee' }}>
        <button onClick={() => toggle(id)} className="w-full flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${TEAL}14` }}>
            <Icon size={20} style={{ color: TEAL }} />
          </div>
          <span className="flex-1 text-left font-extrabold text-sm" style={{ color: NAVY }}>{title}</span>
          <ChevronDown size={18} style={{ color: ASH, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>
        {isOpen && <div className="px-4 pb-4">{children}</div>}
      </div>
    );
  };

  const Chip = ({ active, onClick, children }: any) => (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-lg text-xs font-extrabold border"
      style={{
        background: active ? NAVY : '#fff',
        color: active ? '#fff' : '#5b616b',
        borderColor: active ? NAVY : '#e6e9ee',
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen pb-28" style={{ background: '#f4f6f8' }}>
      <div className="max-w-lg mx-auto">
        {/* Gradient header */}
        <div className="px-5 pt-6 pb-8 rounded-b-3xl" style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #1d4276 60%, ${TEAL} 130%)` }}>
          <p className="text-sm font-bold" style={{ color: '#9fb4d8' }}>
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}{firstName ? `, ${firstName}` : ''}
          </p>
          <h1 className="text-2xl font-extrabold text-white mt-0.5">My Kitchen</h1>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={28} color="#fff" /></div>
          ) : !user ? (
            <div className="mt-5 text-center">
              <p className="text-sm font-bold mb-4" style={{ color: '#c7d5ec' }}>Sign in to track your gas, prices and refills</p>
              <button onClick={() => router.push('/login')} className="w-full py-3.5 rounded-xl font-extrabold" style={{ background: '#fff', color: NAVY }}>Sign in</button>
            </div>
          ) : !lastRefill ? (
            <div className="mt-5 flex items-center gap-4">
              <Cylinder pct={0} color="#c3cbd4" />
              <div className="flex-1">
                <p className="text-white font-extrabold">No refill tracked yet</p>
                <p className="text-xs font-bold mt-1 mb-3" style={{ color: '#c7d5ec' }}>After your first weighed refill, your gas level appears here automatically.</p>
                <button onClick={() => router.push('/buy')} className="px-5 py-2.5 rounded-xl font-extrabold text-sm flex items-center gap-2" style={{ background: TEAL, color: '#fff' }}>
                  <Flame size={16} /> Order your first refill
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-5">
              <Cylinder pct={fillH} color={levelColor} />
              <div className="flex-1">
                <p className="text-4xl font-extrabold text-white">{daysLeft}<span className="text-base font-bold ml-1" style={{ color: '#c7d5ec' }}>days left</span></p>
                <p className="text-xs font-bold mt-1" style={{ color: '#c7d5ec' }}>≈ {kgLeft.toFixed(1)} kg of {lastRefill.kg} kg remaining</p>
                {pct <= 25 && (
                  <p className="text-xs font-extrabold mt-2 px-2 py-1 rounded-lg inline-block" style={{ background: 'rgba(231,76,60,.25)', color: '#ffb4ac' }}>
                    Gas is running low — refill by {refillBy}
                  </p>
                )}
                <button onClick={() => router.push('/buy')} className="mt-3 px-5 py-2.5 rounded-xl font-extrabold text-sm flex items-center gap-2" style={{ background: TEAL, color: '#fff' }}>
                  <Flame size={16} /> Refill Now
                </button>
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="px-4 mt-4 space-y-3">
            {/* Calculator */}
            <Card id="calc" icon={Calculator} title="How much gas do you need?">
              <div className="space-y-3 pt-1">
                <div>
                  <p className="text-xs font-extrabold mb-2 flex items-center gap-1.5" style={{ color: ASH }}><Users size={13} /> People at home</p>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 4, 6, 8].map((n) => <Chip key={n} active={people === n} onClick={() => setPeople(n)}>{n === 8 ? '7+' : n === 6 ? '5–6' : n === 4 ? '3–4' : n}</Chip>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-extrabold mb-2 flex items-center gap-1.5" style={{ color: ASH }}><UtensilsCrossed size={13} /> Cooking per day</p>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3].map((n) => <Chip key={n} active={meals === n} onClick={() => setMeals(n)}>{n === 1 ? 'Once' : n === 2 ? 'Twice' : '3 times'}</Chip>)}
                    <Chip active={meals === 5} onClick={() => setMeals(5)}>All day</Chip>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-extrabold mb-2" style={{ color: ASH }}>Cylinder size</p>
                  <div className="flex gap-2 flex-wrap">
                    {CYLINDER_SIZES.map((s) => <Chip key={s} active={cylSize === s} onClick={() => setCylSize(s)}>{s}kg</Chip>)}
                  </div>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: `${TEAL}0d`, border: `1.5px dashed ${TEAL}55` }}>
                  <p className="text-sm font-extrabold" style={{ color: NAVY }}>
                    You need ≈ {kgNeeded.toFixed(1)} kg refill
                  </p>
                  <p className="text-xs font-bold mt-1" style={{ color: '#5b616b' }}>
                    A full {cylSize}kg lasts you ≈ {refillDays} days · estimated cost ₦{estCost.toLocaleString()}
                  </p>
                </div>
                <button onClick={() => router.push('/buy')} className="w-full py-3 rounded-xl font-extrabold text-sm text-white" style={{ background: TEAL }}>
                  Order this refill
                </button>
              </div>
            </Card>

            {/* Price compare */}
            <Card id="prices" icon={Lightbulb} title="Best prices near you">
              {sellers.length === 0 ? (
                <p className="text-xs font-bold py-2" style={{ color: ASH }}>Prices appear here as sellers near you join OGas.</p>
              ) : (
                <div className="space-y-2 pt-1">
                  {sellers.map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: i === 0 ? `${TEAL}66` : '#eef1f5', background: i === 0 ? `${TEAL}08` : '#fff' }}>
                      <div>
                        <p className="text-sm font-extrabold" style={{ color: NAVY }}>{s.name}</p>
                        {s.landmark && <p className="text-xs font-bold" style={{ color: ASH }}>{s.landmark}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold" style={{ color: i === 0 ? TEAL : NAVY }}>₦{s.price125.toLocaleString()}<span className="text-[10px] font-bold" style={{ color: ASH }}> /12.5kg</span></p>
                        {i === 0 && <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded" style={{ background: TEAL, color: '#fff' }}>BEST PRICE</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Trusted seller */}
            <Card id="seller" icon={Handshake} title="Your trusted seller">
              {trusted ? (
                <div className="pt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-white shrink-0" style={{ background: NAVY }}>
                      {trusted.sellerName!.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold" style={{ color: NAVY }}>{trusted.sellerName}</p>
                      <p className="text-[11px] font-bold" style={{ color: ASH }}>✔ Verified · ⚖️ Weighed refills</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {trusted.sellerPhone && (
                      <a href={`tel:${trusted.sellerPhone}`} className="flex-1 py-2.5 rounded-xl text-center text-sm font-extrabold flex items-center justify-center gap-1.5 border" style={{ borderColor: '#e6e9ee', color: NAVY }}>
                        <Phone size={15} /> Call
                      </a>
                    )}
                    <button onClick={() => router.push('/buy')} className="flex-1 py-2.5 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-1.5" style={{ background: TEAL }}>
                      <RotateCcw size={15} /> Same as last time
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-bold py-2" style={{ color: ASH }}>Your most-used seller will appear here after your first order.</p>
              )}
            </Card>

            {/* Gas Points balance */}
            <Card id="tank" icon={Fuel} title="Gas Points">
              <div className="pt-1 text-center">
                <p className="text-3xl font-extrabold" style={{ color: gasPoints > 0 ? '#0fa958' : NAVY }}>{gasPoints.toLocaleString()}<span className="text-base font-bold ml-1" style={{ color: ASH }}>GP</span></p>
                <p className="text-xs font-bold mt-1" style={{ color: ASH }}>1 GP = ₦1 of free gas — spend up to 10% off any order</p>
                <button onClick={() => router.push('/tank')} className="mt-3 px-5 py-2.5 rounded-xl text-sm font-extrabold border" style={{ borderColor: TEAL, color: TEAL }}>
                  Open my Gas Points
                </button>
              </div>
            </Card>

            {/* Recent refills */}
            <Card id="history" icon={ClipboardList} title="Recent refills">
              {recentRefills.length === 0 ? (
                <p className="text-xs font-bold py-2" style={{ color: ASH }}>Every weighed refill will be recorded here — your proof against cheating.</p>
              ) : (
                <div className="space-y-2 pt-1">
                  {recentRefills.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                      <div>
                        <p className="text-sm font-extrabold" style={{ color: NAVY }}>⚖️ Weighed {r.kg} kg</p>
                        <p className="text-[11px] font-bold" style={{ color: ASH }}>
                          {r.date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}{r.sellerName ? ` · ${r.sellerName}` : ''}
                        </p>
                      </div>
                      {r.price ? <p className="text-sm font-extrabold" style={{ color: NAVY }}>₦{r.price.toLocaleString()}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Safety tip */}
            <Card id="safety" icon={ShieldCheck} title="Safety tip of the day">
              <p className="text-sm font-bold pt-1" style={{ color: '#5b616b' }}>{todayTip}</p>
              <p className="text-[11px] font-bold mt-2" style={{ color: ASH }}>Your family's safety comes first.</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Cylinder({ pct, color }: { pct: number; color: string }) {
  // Animated SVG gas cylinder with fill level
  const fillY = 110 - (pct / 100) * 80; // body from y=30 to y=110
  return (
    <svg width="76" height="120" viewBox="0 0 76 120" className="shrink-0">
      <defs>
        <linearGradient id="cylBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e8edf4" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d5dde8" />
        </linearGradient>
        <clipPath id="cylClip">
          <rect x="18" y="30" width="40" height="80" rx="12" />
        </clipPath>
      </defs>
      {/* valve + neck */}
      <rect x="32" y="8" width="12" height="10" rx="2" fill="#9fb4d8" />
      <rect x="28" y="18" width="20" height="12" rx="3" fill="#7e93b8" />
      {/* body */}
      <rect x="18" y="30" width="40" height="80" rx="12" fill="url(#cylBody)" stroke="#b9c5d6" strokeWidth="2" />
      {/* liquid fill */}
      <g clipPath="url(#cylClip)">
        <rect x="18" y={fillY} width="40" height={110 - fillY} fill={color} style={{ transition: 'y .6s ease, height .6s ease' }} />
      </g>
      {/* shine */}
      <rect x="24" y="36" width="5" height="68" rx="2.5" fill="rgba(255,255,255,.55)" />
      {/* pct label */}
      <text x="38" y="74" textAnchor="middle" fontSize="14" fontWeight="800" fill={pct > 45 ? '#fff' : '#16305e'}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}
