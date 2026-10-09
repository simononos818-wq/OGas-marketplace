'use client';

import SellerEntryCards from "../../../components/SellerEntryCards";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../../lib/firebase';
import { MapPin, Camera, CheckCircle, Loader2, AlertCircle, ChevronLeft, Lock, Store, BadgeCheck, Banknote } from 'lucide-react';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

const LEVELS = [
  { n: 1, name: 'PROFILED', icon: Store, tag: 'Your shop has a name' },
  { n: 2, name: 'LOCATED', icon: MapPin, tag: 'Buyers nearby can find you' },
  { n: 3, name: 'VERIFIED', icon: BadgeCheck, tag: 'Trusted with the badge' },
  { n: 4, name: 'PAYOUT-READY', icon: Banknote, tag: 'Money flows to you' },
];

// ---------- Verification helpers ----------

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Minimal JPEG EXIF GPS extractor (no dependency). Returns null if no GPS data.
async function extractExifGps(file: File): Promise<{ lat: number; lng: number } | null> {
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf[0] !== 0xff || buf[1] !== 0xd8) return null; // not JPEG
    let offset = 2;
    while (offset < buf.length - 4) {
      if (buf[offset] !== 0xff) return null;
      const marker = buf[offset + 1];
      const len = (buf[offset + 2] << 8) | buf[offset + 3];
      if (marker === 0xe1) {
        const dv = new DataView(buf.buffer, buf.byteOffset + offset + 4, len - 2);
        if (dv.getUint32(0) !== 0x45786966) return null; // "Exif\0\0"
        const tiff = 6;
        const little = dv.getUint16(tiff) === 0x4949;
        const u16 = (o: number) => dv.getUint16(tiff + o, little);
        const u32 = (o: number) => dv.getUint32(tiff + o, little);
        const ifd0 = u32(4);
        const entries = u16(ifd0);
        let gpsPtr = 0;
        for (let i = 0; i < entries; i++) {
          const e = ifd0 + 2 + i * 12;
          if (u16(e) === 0x8825) gpsPtr = u32(e + 8);
        }
        if (!gpsPtr) return null;
        const gEntries = u16(gpsPtr);
        let latRef = 0, lngRef = 0, latOff = 0, lngOff = 0;
        for (let i = 0; i < gEntries; i++) {
          const e = gpsPtr + 2 + i * 12;
          const tag = u16(e);
          if (tag === 1) latRef = dv.getUint8(tiff + e + 8);
          else if (tag === 2) latOff = u32(e + 8);
          else if (tag === 3) lngRef = dv.getUint8(tiff + e + 8);
          else if (tag === 4) lngOff = u32(e + 8);
        }
        if (!latOff || !lngOff) return null;
        const rat = (o: number) => u32(o) / (u32(o + 4) || 1);
        const dms = (o: number) => rat(o) + rat(o + 8) / 60 + rat(o + 16) / 3600;
        let lat = dms(latOff);
        let lng = dms(lngOff);
        if (latRef === 0x53) lat = -lat; // S
        if (lngRef === 0x57) lng = -lng; // W
        if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
        return { lat, lng };
      }
      offset += 2 + len;
    }
    return null;
  } catch {
    return null;
  }
}

export default function SellerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [celebrating, setCelebrating] = useState(0); // level just completed (0 = none)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    businessName: '',
    sellerType: 'neighbourhood',
    phone: '',
    landmark: '',
    address: '',
    stockKg: '',
    price3kg: '',
    price6kg: '',
    price12_5kg: '',
    hours: '8am - 8pm',
    delivery: false,
  });

  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    manual?: boolean;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);

  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [stockPhoto, setStockPhoto] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [stockPreview, setStockPreview] = useState('');

  const captureLocation = () => {
    setLocating(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Location is not supported by this browser. Please open this page in Chrome and try again.');
      setLocating(false);
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      setLocating(false);
    };

    const failWith = (err: GeolocationPositionError) => {
      let msg = 'Unable to get location. Please check that location is ON and try again.';
      if (err.code === err.PERMISSION_DENIED) {
        msg = 'Location permission is blocked. Browser: tap the lock icon in the address bar, allow Location, then retry. App: go to Settings → Apps → OGas → Permissions → Location → Allow, then retry.';
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        msg = 'GPS signal not found. Step outside or near a window and tap Capture again.';
      } else if (err.code === err.TIMEOUT) {
        msg = 'GPS is taking too long. Move to an open area and tap Capture again.';
      }
      setError(msg);
      setLocating(false);
    };

    // Attempt 1: high accuracy, but accept a recent cached fix (max 1 min old)
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        // Attempt 2 (fallback): network/Wi-Fi location is accurate enough to pin a shop
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (err2) => failWith(err2),
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  // Manual pin fallback — for phones with broken/blocked GPS (common on
  // budget devices). Seller drags a pin to their shop; flagged 'manual'
  // for admin review. Photo-GPS cross-check still runs at submit.
  const openManualMap = async () => {
    setError('');
    setManualMode(true);
    setMapLoading(true);
    try {
      if (!(window as any).L) {
        await new Promise<void>((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
          const sc = document.createElement('script');
          sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          sc.onload = () => resolve();
          sc.onerror = () => reject(new Error('map failed to load'));
          document.body.appendChild(sc);
        });
      }
      // Best-effort: center near the seller with a coarse fix, else Ughelli
      let center: [number, number] = [5.5007, 6.0024]; // Ughelli, Delta State
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, {
            enableHighAccuracy: false, timeout: 5000, maximumAge: 600000,
          })
        );
        center = [pos.coords.latitude, pos.coords.longitude];
      } catch { /* keep Ughelli default */ }

      const L = (window as any).L;
      setTimeout(() => {
        if (!mapDivRef.current || leafletMapRef.current) { setMapLoading(false); return; }
        const map = L.map(mapDivRef.current).setView(center, 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        const marker = L.marker(center, { draggable: true }).addTo(map);
        leafletMapRef.current = map;
        leafletMarkerRef.current = marker;
        setMapLoading(false);
      }, 60);
    } catch {
      setMapLoading(false);
      setManualMode(false);
      setError('Map could not load. Check your data connection and try again.');
    }
  };

  const cancelManualMap = () => {
    try { leafletMapRef.current?.remove(); } catch { /* noop */ }
    leafletMapRef.current = null;
    leafletMarkerRef.current = null;
    setManualMode(false);
  };

  const confirmManualPin = () => {
    const m = leafletMarkerRef.current;
    if (!m) return;
    const p = m.getLatLng();
    try { leafletMapRef.current?.remove(); } catch { /* noop */ }
    leafletMapRef.current = null;
    leafletMarkerRef.current = null;
    setLocation({ lat: p.lat, lng: p.lng, accuracy: 9999, manual: true });
    setLocationConfirmed(false);
    setManualMode(false);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'stock') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'front') {
      setFrontPhoto(file);
      setFrontPreview(preview);
    } else {
      setStockPhoto(file);
      setStockPreview(preview);
    }
  };

  const uploadImage = async (file: File, path: string) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  // Level-up ceremony: show the celebration, then advance
  const levelUp = (completedLevel: number) => {
    setCelebrating(completedLevel);
    setTimeout(() => {
      setCelebrating(0);
      setStep(completedLevel + 1);
      window.scrollTo(0, 0);
    }, 1900);
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in');
      return;
    }
    if (!location || !locationConfirmed) {
      setError('Please capture and confirm your location');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uid = auth.currentUser.uid;
      if (!frontPhoto || !stockPhoto) {
        throw new Error('Both photos are required');
      }

      // ---- Smart verification checks (run before submit) ----
      const flags: Record<string, any> = {
        weakGpsFix: !location.manual && location.accuracy > 150,
        manualLocation: Boolean(location.manual),
        duplicatePhone: false,
        frontPhotoGps: null as null | { lat: number; lng: number },
        stockPhotoGps: null as null | { lat: number; lng: number },
        photoGpsMismatch: false,
        checkedAt: new Date().toISOString(),
      };

      // 1) EXIF GPS cross-check: photo location must be near captured GPS
      const [frontGps, stockGps] = await Promise.all([
        extractExifGps(frontPhoto),
        extractExifGps(stockPhoto),
      ]);
      flags.frontPhotoGps = frontGps;
      flags.stockPhotoGps = stockGps;
      for (const g of [frontGps, stockGps]) {
        if (g && haversineMeters(g.lat, g.lng, location.lat, location.lng) > 500) {
          flags.photoGpsMismatch = true;
        }
      }

      // 2) Duplicate phone check (best-effort; rules may limit reads)
      try {
        const phoneQ = query(collection(db, 'sellers'), where('phone', '==', form.phone));
        const phoneSnap = await getDocs(phoneQ);
        flags.duplicatePhone = phoneSnap.docs.some((d) => d.id !== uid);
      } catch {
        /* best-effort */
      }

      flags.autoChecksPassed = !flags.photoGpsMismatch && !flags.duplicatePhone && !flags.weakGpsFix
        ? 3
        : [!flags.photoGpsMismatch, !flags.duplicatePhone, !flags.weakGpsFix].filter(Boolean).length;

      const frontUrl = await uploadImage(frontPhoto, `sellers/${uid}/front.jpg`);
      const stockUrl = await uploadImage(stockPhoto, `sellers/${uid}/stock.jpg`);

      await setDoc(doc(db, 'sellers', uid), {
      sellerStatus: 'pending',
        uid,
        businessName: form.businessName,
        sellerType: form.sellerType,
        phone: form.phone,
        landmark: form.landmark,
        address: form.address,
        location: {
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          source: location.manual ? 'manual_pin' : 'gps',
          confirmedAt: new Date().toISOString(),
        },
        stockKg: Number(form.stockKg) || 0,
        prices: {
          '3kg': Number(form.price3kg) || 0,
          '6kg': Number(form.price6kg) || 0,
          '12.5kg': Number(form.price12_5kg) || 0,
        },
        hours: form.hours,
        offersDelivery: form.delivery,
        photos: { front: frontUrl, stock: stockUrl },
        status: 'pending',
        verified: false,
        isVerified: false,
        isApproved: false,
        isActive: false,
        level: 3,
        gates: {
          profile: true,
          location: true,
          photos: true,
          bankLinked: false,
          approved: false,
        },
        verificationFlags: flags,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, 'users', uid),
        { role: 'seller', sellerStatus: 'pending' },
        { merge: true }
      );

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm font-bold focus:outline-none";
  const inputStyle = { background: '#f4f6f8', border: '1.5px solid #e6e9ee', color: NAVY };

  /* ================= LEVEL TRACK (Moniepoint-style) ================= */
  const LevelTrack = ({ current }: { current: number }) => (
    <div className="px-4 pt-3 pb-1">
      <div className="flex items-center">
        {LEVELS.map((lv, i) => {
          const done = current > lv.n;
          const active = current === lv.n;
          const Icon = done ? CheckCircle : lv.icon;
          return (
            <div key={lv.n} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center" style={{ minWidth: 52 }}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={
                    done
                      ? { background: TEAL, boxShadow: '0 3px 8px rgba(18,165,176,.35)' }
                      : active
                      ? { background: NAVY, boxShadow: `0 0 0 3px #fff, 0 0 0 5px ${TEAL}` }
                      : { background: '#e6e9ee' }
                  }
                >
                  {i === 3 && !done && !active ? (
                    <Lock size={14} color="#8a8f98" />
                  ) : (
                    <Icon size={16} color={done || active ? '#fff' : '#8a8f98'} />
                  )}
                </div>
                <span
                  className="mt-1 text-[8.5px] font-extrabold tracking-wide"
                  style={{ color: done || active ? NAVY : '#b8bec6' }}
                >
                  {lv.name}
                </span>
              </div>
              {i < LEVELS.length - 1 && (
                <div className="flex-1 h-1 rounded-full mx-1 mb-4" style={{ background: current > lv.n ? TEAL : '#e6e9ee' }} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-[11px] font-bold mt-1" style={{ color: '#8a8f98' }}>
        Level {Math.min(current, 4)} of 4 · {LEVELS[Math.min(current, 4) - 1].tag}
      </p>
    </div>
  );

  /* ================= LEVEL-UP CELEBRATION ================= */
  if (celebrating > 0) {
    const lv = LEVELS[celebrating - 1];
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: `linear-gradient(160deg, ${NAVY}, #0e8a94)` }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: TEAL, boxShadow: '0 0 0 10px rgba(45,212,194,.2), 0 0 0 22px rgba(45,212,194,.08)' }}
          >
            <lv.icon size={42} color="#fff" />
          </div>
          <p className="text-[12px] font-extrabold tracking-[0.25em] mb-1" style={{ color: '#2dd4c2' }}>
            LEVEL {lv.n} COMPLETE
          </p>
          <h1 className="text-3xl font-black text-white mb-2">{lv.name}</h1>
          <p className="text-sm font-bold" style={{ color: '#c9d9e6' }}>{lv.tag}</p>
        </div>
      </div>
    );
  }

  /* ================= FINAL: LEVEL 3 REACHED ================= */
  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: `linear-gradient(160deg, ${NAVY}, #0e8a94)` }}
      >
        <div className="text-center max-w-md w-full">
          <div className="text-5xl mb-4">🎖️</div>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: '#0fa958', boxShadow: '0 0 0 10px rgba(15,169,88,.2), 0 0 0 22px rgba(15,169,88,.08)' }}
          >
            <BadgeCheck size={42} color="#fff" />
          </div>
          <p className="text-[12px] font-extrabold tracking-[0.25em] mb-1" style={{ color: '#2dd4c2' }}>
            LEVEL 3 REACHED
          </p>
          <h1 className="text-3xl font-black text-white mb-2">VERIFIED</h1>
          <p className="text-sm font-bold mb-6" style={{ color: '#c9d9e6' }}>
            {form.businessName || 'Your shop'} is submitted for review — usually approved within a few hours.
          </p>

          {/* the journey so far */}
          <div className="rounded-2xl p-4 mb-5 text-left" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
            {LEVELS.map((lv) => {
              const done = lv.n <= 3;
              const Icon = done ? CheckCircle : Lock;
              return (
                <div key={lv.n} className="flex items-center gap-3 py-2" style={{ opacity: done ? 1 : 0.55 }}>
                  <Icon size={16} color={done ? '#2dd4c2' : '#8fa6c9'} />
                  <div className="flex-1">
                    <p className="text-[12px] font-extrabold text-white">Level {lv.n} · {lv.name}</p>
                    <p className="text-[10px]" style={{ color: '#9fb4d8' }}>{lv.tag}</p>
                  </div>
                  {done && <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: 'rgba(45,212,194,.15)', color: '#2dd4c2' }}>DONE</span>}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => router.push('/seller/bank')}
            className="w-full text-white font-extrabold py-4 rounded-xl mb-3"
            style={{ background: TEAL, boxShadow: '0 4px 14px rgba(18,165,176,.4)' }}
          >
            Unlock Level 4 · Link payout account →
          </button>
          <button
            onClick={() => router.push('/seller/dashboard')}
            className="w-full font-bold py-3 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,.1)', color: '#c9d9e6' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SellerEntryCards />
    <div className="min-h-screen pb-20" style={{ background: '#f4f6f8' }}>
      <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: '#eee' }}>
        <div className="p-4 pb-0 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background: '#f4f6f8' }}>
            <ChevronLeft size={18} style={{ color: NAVY }} />
          </button>
          <div>
            <h1 className="text-lg font-extrabold" style={{ color: NAVY }}>Become an OGas Seller</h1>
            <p className="text-xs font-bold" style={{ color: '#8a8f98' }}>4 levels to a paying store</p>
          </div>
        </div>
        <LevelTrack current={step} />
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {error && (
          <div className="border rounded-xl p-3 flex gap-2 text-sm font-bold" style={{ background: '#fdeceb', borderColor: '#f5b3ae', color: '#e74c3c' }}>
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)` }}>
              <p className="text-[10px] font-extrabold tracking-[0.2em] mb-1" style={{ color: '#2dd4c2' }}>LEVEL 1 · PROFILED</p>
              <h2 className="text-lg font-extrabold text-white">Tell us about the business</h2>
              <p className="text-[11px] font-bold mt-1" style={{ color: '#9fb4d8' }}>This is the name buyers will see on the map.</p>
            </div>
            <input placeholder="Business / Shop Name" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} className={inputCls} style={inputStyle} required />
            <select value={form.sellerType} onChange={e => setForm({ ...form, sellerType: e.target.value })} className={inputCls} style={inputStyle}>
              <option value="neighbourhood">Neighbourhood Seller (even 200kg)</option>
              <option value="retailer">Verified Retailer</option>
              <option value="plant">Gas Plant</option>
            </select>
            <input placeholder="Phone Number (WhatsApp preferred)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} style={inputStyle} />
            <input placeholder="Nearest Landmark" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} className={inputCls} style={inputStyle} />
            <textarea placeholder="Full Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls + " h-24"} style={inputStyle} />
            <button onClick={() => levelUp(1)} disabled={!form.businessName || !form.phone} className="w-full text-white font-bold py-3.5 rounded-xl disabled:opacity-40" style={{ background: TEAL, boxShadow: '0 4px 12px rgba(18,165,176,.3)' }}>Complete Level 1 →</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)` }}>
              <p className="text-[10px] font-extrabold tracking-[0.2em] mb-1" style={{ color: '#2dd4c2' }}>LEVEL 2 · LOCATED</p>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2"><MapPin size={18} style={{ color: '#2dd4c2' }} /> Put your shop on the map</h2>
              <p className="text-[11px] font-bold mt-1" style={{ color: '#9fb4d8' }}>Stand at your selling spot. Buyers near this pin will find you first.</p>
            </div>
            {!location ? (
              <>
                <button onClick={captureLocation} disabled={locating} className="w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2" style={{ background: NAVY }}>
                  {locating ? (<><Loader2 className="animate-spin" size={20} /> Getting location... (up to 30 secs)</>) : (<><MapPin size={20} /> I am at my selling location — Capture GPS</>)}
                </button>
                <div className="text-center">
                  <button type="button" onClick={openManualMap} className="text-xs font-bold underline" style={{ color: TEAL }}>
                    GPS not working? Set your pin on a map instead
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white border rounded-xl p-4 space-y-3" style={{ borderColor: '#e6e9ee', boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
                <div className="text-sm font-bold" style={{ color: '#5b616b' }}>
                  <p><span style={{ color: '#8a8f98' }}>Latitude:</span> {location.lat.toFixed(6)}</p>
                  <p><span style={{ color: '#8a8f98' }}>Longitude:</span> {location.lng.toFixed(6)}</p>
                  <p><span style={{ color: '#8a8f98' }}>Accuracy:</span> {location.manual ? 'Manual pin (set on map)' : `±${Math.round(location.accuracy)} meters`}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={captureLocation} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ background: '#f4f6f8', color: NAVY }}>Recapture</button>
                  <button onClick={() => setLocationConfirmed(true)} className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={locationConfirmed ? { background: '#0fa958' } : { background: TEAL }}>
                    {locationConfirmed ? '✓ Confirmed' : 'Confirm this is correct'}
                  </button>
                </div>
              </div>
            )}
            {manualMode && (
              <div className="bg-white border rounded-xl p-3 space-y-3" style={{ borderColor: '#e6e9ee' }}>
                <p className="text-xs font-bold" style={{ color: '#5b616b' }}>
                  Zoom in and drag the pin to your exact shop location, then confirm. Buyers near this pin will find your shop.
                </p>
                <div ref={mapDivRef} className="w-full rounded-lg" style={{ height: 260, background: '#f4f6f8' }} />
                {mapLoading && <p className="text-xs font-bold" style={{ color: '#8a8f98' }}>Loading map…</p>}
                <div className="flex gap-2">
                  <button onClick={cancelManualMap} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ background: '#e6e9ee', color: NAVY }}>Cancel</button>
                  <button onClick={confirmManualPin} disabled={mapLoading} className="flex-1 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-40" style={{ background: TEAL }}>Use this pin location</button>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold" style={{ background: '#e6e9ee', color: NAVY }}>Back</button>
              <button onClick={() => levelUp(2)} disabled={!locationConfirmed} className="flex-1 text-white font-bold py-3 rounded-xl disabled:opacity-40" style={{ background: TEAL, boxShadow: '0 4px 12px rgba(18,165,176,.3)' }}>Complete Level 2 →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)` }}>
              <p className="text-[10px] font-extrabold tracking-[0.2em] mb-1" style={{ color: '#2dd4c2' }}>LEVEL 3 · VERIFIED</p>
              <h2 className="text-lg font-extrabold text-white">Prove the shop is real</h2>
              <p className="text-[11px] font-bold mt-1" style={{ color: '#9fb4d8' }}>Take the photos at your shop — they verify you faster and earn the badge.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="border border-dashed rounded-xl p-4 text-center cursor-pointer" style={{ background: '#fff', borderColor: '#c3cbd4' }}>
                {frontPreview ? (<img src={frontPreview} alt="Front" className="w-full h-32 object-cover rounded-lg" />) : (<div className="h-32 flex flex-col items-center justify-center" style={{ color: '#8a8f98' }}><Camera size={28} /><span className="text-xs mt-2 font-bold">Front of location</span></div>)}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhoto(e, 'front')} />
              </label>
              <label className="border border-dashed rounded-xl p-4 text-center cursor-pointer" style={{ background: '#fff', borderColor: '#c3cbd4' }}>
                {stockPreview ? (<img src={stockPreview} alt="Stock" className="w-full h-32 object-cover rounded-lg" />) : (<div className="h-32 flex flex-col items-center justify-center" style={{ color: '#8a8f98' }}><Camera size={28} /><span className="text-xs mt-2 font-bold">Your gas stock</span></div>)}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhoto(e, 'stock')} />
              </label>
            </div>
            <input type="number" placeholder="Current stock (kg) e.g. 200" value={form.stockKg} onChange={e => setForm({ ...form, stockKg: e.target.value })} className={inputCls} style={inputStyle} />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="3kg price" value={form.price3kg} onChange={e => setForm({ ...form, price3kg: e.target.value })} className={inputCls + " text-sm"} style={inputStyle} />
              <input type="number" placeholder="6kg price" value={form.price6kg} onChange={e => setForm({ ...form, price6kg: e.target.value })} className={inputCls + " text-sm"} style={inputStyle} />
              <input type="number" placeholder="12.5kg price" value={form.price12_5kg} onChange={e => setForm({ ...form, price12_5kg: e.target.value })} className={inputCls + " text-sm"} style={inputStyle} />
            </div>
            <input placeholder="Operating hours (e.g. 8am - 8pm)" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} className={inputCls} style={inputStyle} />
            <label className="flex items-center gap-2 text-sm font-bold" style={{ color: '#5b616b' }}>
              <input type="checkbox" checked={form.delivery} onChange={e => setForm({ ...form, delivery: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: TEAL }} />
              I can deliver nearby
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold" style={{ background: '#e6e9ee', color: NAVY }}>Back</button>
              <button onClick={handleSubmit} disabled={loading || !frontPhoto || !stockPhoto} className="flex-1 text-white font-bold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: TEAL, boxShadow: '0 4px 12px rgba(18,165,176,.3)' }}>
                {loading ? (<><Loader2 className="animate-spin" size={18} /> Verifying & submitting...</>) : 'Reach Level 3 🎖'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
