'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../../lib/firebase';
import { MapPin, Camera, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function SellerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form data
  const [form, setForm] = useState({
    businessName: '',
    sellerType: 'neighbourhood', // neighbourhood | retailer | plant
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

  // Location
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  // Photos
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [stockPhoto, setStockPhoto] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [stockPreview, setStockPreview] = useState('');

  // Capture accurate GPS (Moniepoint style)
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
      (err) => {
        setError('Unable to get location. Please enable GPS and try again.');
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
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

      // Upload photos
      const frontUrl = await uploadImage(frontPhoto, `sellers/${uid}/front.jpg`);
      const stockUrl = await uploadImage(stockPhoto, `sellers/${uid}/stock.jpg`);

      // Save seller profile
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
        photos: {
          front: frontUrl,
          stock: stockUrl,
        },
        status: 'pending', // admin will approve
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Also update user role
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

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
          <p className="text-gray-400 mb-6">
            Your seller application is under review. You will be able to start receiving orders once approved (usually within a few hours).
          </p>
          <button
            onClick={() => router.push('/seller/dashboard')}
            className="bg-orange-500 text-black font-bold px-8 py-3 rounded-xl"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-black border-b border-gray-800 p-4 z-10">
        <h1 className="text-xl font-bold">Become an OGas Seller</h1>
        <p className="text-sm text-gray-400">Step {step} of 3</p>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {error && (
          <div className="bg-red-900/40 border border-red-500 rounded-xl p-3 flex gap-2 text-sm">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1 - Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Business Details</h2>

            <input
              placeholder="Business / Shop Name"
              value={form.businessName}
              onChange={e => setForm({ ...form, businessName: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3"
              required
            />

            <select
              value={form.sellerType}
              onChange={e => setForm({ ...form, sellerType: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3"
            >
              <option value="neighbourhood">Neighbourhood Seller (even 200kg)</option>
              <option value="retailer">Verified Retailer</option>
              <option value="plant">Gas Plant</option>
            </select>

            <input
              placeholder="Phone Number (WhatsApp preferred)"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3"
            />

            <input
              placeholder="Nearest Landmark"
              value={form.landmark}
              onChange={e => setForm({ ...form, landmark: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3"
            />

            <textarea
              placeholder="Full Address"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 h-24"
            />

            <button
              onClick={() => setStep(2)}
              disabled={!form.businessName || !form.phone}
              className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl disabled:opacity-40"
            >
              Next → Location
            </button>
          </div>
        )}

        {/* STEP 2 - Location (Moniepoint style) */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin size={20} /> Accurate Location
            </h2>
            <p className="text-sm text-gray-400">
              You must be physically at your selling location right now. We capture high-accuracy GPS.
            </p>

            {!location ? (
              <button
                onClick={captureLocation}
                disabled={locating}
                className="w-full bg-orange-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                {locating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Getting precise location...
                  </>
                ) : (
                  <>
                    <MapPin size={20} /> I am at my selling location — Capture GPS
                  </>
                )}
              </button>
            ) : (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="text-sm">
                  <p><span className="text-gray-400">Latitude:</span> {location.lat.toFixed(6)}</p>
                  <p><span className="text-gray-400">Longitude:</span> {location.lng.toFixed(6)}</p>
                  <p><span className="text-gray-400">Accuracy:</span> ±{Math.round(location.accuracy)} meters</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={captureLocation}
                    className="flex-1 bg-gray-800 py-2 rounded-lg text-sm"
                  >
                    Recapture
                  </button>
                  <button
                    onClick={() => setLocationConfirmed(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      locationConfirmed ? 'bg-green-600' : 'bg-orange-500 text-black'
                    }`}
                  >
                    {locationConfirmed ? '✓ Confirmed' : 'Confirm this is correct'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-800 py-3 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!locationConfirmed}
                className="flex-1 bg-orange-500 text-black font-bold py-3 rounded-xl disabled:opacity-40"
              >
                Next → Photos & Prices
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 - Photos + Prices + Submit */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Photos & Pricing</h2>

            {/* Photos */}
            <div className="grid grid-cols-2 gap-3">
              <label className="bg-gray-900 border border-dashed border-gray-600 rounded-xl p-4 text-center cursor-pointer">
                {frontPreview ? (
                  <img src={frontPreview} alt="Front" className="w-full h-32 object-cover rounded-lg" />
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                    <Camera size={28} />
                    <span className="text-xs mt-2">Front of location</span>
                  </div>
                )}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhoto(e, 'front')} />
              </label>

              <label className="bg-gray-900 border border-dashed border-gray-600 rounded-xl p-4 text-center cursor-pointer">
                {stockPreview ? (
                  <img src={stockPreview} alt="Stock" className="w-full h-32 object-cover rounded-lg" />
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                    <Camera size={28} />
                    <span className="text-xs mt-2">Your gas stock</span>
                  </div>
                )}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhoto(e, 'stock')} />
              </label>
            </div>

            {/* Stock & Prices */}
            <input
              type="number"
              placeholder="Current stock (kg) e.g. 200"
              value={form.stockKg}
              onChange={e => setForm({ ...form, stockKg: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3"
            />

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="3kg price"
                value={form.price3kg}
                onChange={e => setForm({ ...form, price3kg: e.target.value })}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-3 text-sm"
              />
              <input
                type="number"
                placeholder="6kg price"
                value={form.price6kg}
                onChange={e => setForm({ ...form, price6kg: e.target.value })}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-3 text-sm"
              />
              <input
                type="number"
                placeholder="12.5kg price"
                value={form.price12_5kg}
                onChange={e => setForm({ ...form, price12_5kg: e.target.value })}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-3 text-sm"
              />
            </div>

            <input
              placeholder="Operating hours (e.g. 8am - 8pm)"
              value={form.hours}
              onChange={e => setForm({ ...form, hours: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3"
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.delivery}
                onChange={e => setForm({ ...form, delivery: e.target.checked })}
                className="w-4 h-4"
              />
              I can deliver nearby
            </label>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-800 py-3 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !frontPhoto || !stockPhoto}
                className="flex-1 bg-orange-500 text-black font-bold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
