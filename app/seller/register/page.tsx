'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../../lib/firebase';
import { MapPin, Camera, CheckCircle, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

export default function SellerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
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
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [stockPhoto, setStockPhoto] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [stockPreview, setStockPreview] = useState('');

  const captureLocation = () => {
    setLocating(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocating(false);
      },
      () => {
        setError('Unable to get location. Please enable GPS and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
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

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in');
      return;
    }
    if (!location || !locationConfirmed) {
      setError('Please capture and confirm your location');
      return;
    }
    if (!frontPhoto || !stockPhoto) {
      setError('Please upload both photos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uid = auth.currentUser.uid;
      const frontUrl = await uploadImage(frontPhoto, `sellers/${uid}/front.jpg`);
      const stockUrl = await uploadImage(stockPhoto, `sellers/${uid}/stock.jpg`);

      await setDoc(doc(db, 'sellers', uid), {
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f4f6f8' }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#e7f9ee' }}>
            <CheckCircle size={40} style={{ color: '#0fa958' }} />
          </div>
          <h1 className="text-2xl font-extrabold mb-2" style={{ color: NAVY }}>Application Submitted!</h1>
          <p className="mb-6 text-sm font-bold" style={{ color: '#8a8f98' }}>
            Your seller application is under review. You will be able to start receiving orders once approved (usually within a few hours).
          </p>
          <button
            onClick={() => router.push('/seller/dashboard')}
            className="text-white font-bold px-8 py-3 rounded-xl"
            style={{ background: TEAL }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: '#f4f6f8' }}>
      <div className="sticky top-0 p-4 z-10 bg-white border-b flex items-center gap-3" style={{ borderColor: '#eee' }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background: '#f4f6f8' }}>
          <ChevronLeft size={18} style={{ color: NAVY }} />
        </button>
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: NAVY }}>Become an OGas Seller</h1>
          <p className="text-xs font-bold" style={{ color: '#8a8f98' }}>Step {step} of 3</p>
        </div>
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
            <h2 className="text-lg font-extrabold" style={{ color: NAVY }}>Business Details</h2>
            <input placeholder="Business / Shop Name" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} className={inputCls} style={inputStyle} required />
            <select value={form.sellerType} onChange={e => setForm({ ...form, sellerType: e.target.value })} className={inputCls} style={inputStyle}>
              <option value="neighbourhood">Neighbourhood Seller (even 200kg)</option>
              <option value="retailer">Verified Retailer</option>
              <option value="plant">Gas Plant</option>
            </select>
            <input placeholder="Phone Number (WhatsApp preferred)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} style={inputStyle} />
            <input placeholder="Nearest Landmark" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} className={inputCls} style={inputStyle} />
            <textarea placeholder="Full Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls + " h-24"} style={inputStyle} />
            <button onClick={() => setStep(2)} disabled={!form.businessName || !form.phone} className="w-full text-white font-bold py-3 rounded-xl disabled:opacity-40" style={{ background: TEAL }}>Next → Location</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold flex items-center gap-2" style={{ color: NAVY }}><MapPin size={20} style={{ color: TEAL }} /> Accurate Location</h2>
            <p className="text-sm font-bold" style={{ color: '#8a8f98' }}>You must be physically at your selling location right now. We capture high-accuracy GPS.</p>
            {!location ? (
              <button onClick={captureLocation} disabled={locating} className="w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2" style={{ background: NAVY }}>
                {locating ? (<><Loader2 className="animate-spin" size={20} /> Getting precise location...</>) : (<><MapPin size={20} /> I am at my selling location — Capture GPS</>)}
              </button>
            ) : (
              <div className="bg-white border rounded-xl p-4 space-y-3" style={{ borderColor: '#e6e9ee', boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
                <div className="text-sm font-bold" style={{ color: '#5b616b' }}>
                  <p><span style={{ color: '#8a8f98' }}>Latitude:</span> {location.lat.toFixed(6)}</p>
                  <p><span style={{ color: '#8a8f98' }}>Longitude:</span> {location.lng.toFixed(6)}</p>
                  <p><span style={{ color: '#8a8f98' }}>Accuracy:</span> ±{Math.round(location.accuracy)} meters</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={captureLocation} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ background: '#f4f6f8', color: NAVY }}>Recapture</button>
                  <button onClick={() => setLocationConfirmed(true)} className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={locationConfirmed ? { background: '#0fa958' } : { background: TEAL }}>
                    {locationConfirmed ? '✓ Confirmed' : 'Confirm this is correct'}
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold" style={{ background: '#e6e9ee', color: NAVY }}>Back</button>
              <button onClick={() => setStep(3)} disabled={!locationConfirmed} className="flex-1 text-white font-bold py-3 rounded-xl disabled:opacity-40" style={{ background: TEAL }}>Next → Photos & Prices</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-extrabold" style={{ color: NAVY }}>Photos & Pricing</h2>
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
              <button onClick={handleSubmit} disabled={loading || !frontPhoto || !stockPhoto} className="flex-1 text-white font-bold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: TEAL }}>
                {loading ? (<><Loader2 className="animate-spin" size={18} /> Submitting...</>) : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
