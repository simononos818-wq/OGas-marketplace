'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import Link from 'next/link';
import { Flame, ChevronRight, ChevronLeft } from 'lucide-react';

export default function SellerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: 'Ughelli North',
    state: 'Delta State',
    prices: {
      '3kg': '',
      '5kg': '',
      '6kg': '',
      '12.5kg': '',
      '25kg': '',
      '50kg': ''
    },
    deliveryFee: '500',
    location: { lat: 5.488262, lng: 6.001054 }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('price_')) {
      const size = name.replace('price_', '');
      setForm(prev => ({
        ...prev,
        prices: { ...prev.prices, [size]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(userCredential.user, { displayName: form.businessName });

      const pricesObj: Record<string, number> = {};
      Object.entries(form.prices).forEach(([size, price]) => {
        if (price) pricesObj[size] = parseInt(price);
      });

      const sellerData = {
        businessName: form.businessName,
        ownerName: form.ownerName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        prices: pricesObj,
        pricePerKg: Math.round(Object.values(pricesObj).reduce((a, b) => a + b, 0) / Object.values(pricesObj).length / 10) || 1600,
        deliveryFee: parseInt(form.deliveryFee) || 500,
        isApproved: false,
        isVerified: false,
        isOnline: true,
        isActive: true,
        isAvailable: true,
        isOpen: true,
        rating: 0,
        totalOrders: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userCredential.user.uid,
        location: form.location,
        geolocation: { latitude: form.location.lat, longitude: form.location.lng },
        supportsDelivery: true,
        supportsPickup: true,
        deliveryAvailable: true,
        availableSizes: Object.keys(pricesObj).map(k => parseFloat(k.replace('kg', ''))),
        paystackSubaccountCode: ''
      };

      await setDoc(doc(db, 'sellers', userCredential.user.uid), sellerData);
      
      // Also save to users collection so they appear on buyer home page
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: form.email,
        displayName: form.businessName,
        phoneNumber: form.phone,
        role: 'seller',
        isActive: true,
        isApproved: true,
        isOnline: true,
        businessName: form.businessName,
        kg6Price: parseInt(form.prices['6kg']) || 0,
        kg12Price: parseInt(form.prices['12.5kg']) || 0,
        kg25Price: parseInt(form.prices['25kg']) || 0,
        rating: 5.0,
        totalOrders: 0,
        location: form.city + ', ' + form.state,
        description: form.businessName + ' - Quality LPG delivery',
        photoURL: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      router.push('/seller/dashboard');
    } catch (err: any) {
      setError(err.message?.replace('Firebase:', '') || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto pt-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <Flame size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold">OGas Seller</h1>
            <p className="text-gray-400 text-sm">Register your gas business</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1,2,3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-orange-500' : 'bg-gray-800'}`} />
          ))}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-xl p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <h2 className="font-bold text-lg mb-1">Business Info</h2>
              <p className="text-gray-400 text-sm mb-4">Tell us about your gas business</p>
              
              <input name="businessName" placeholder="Business Name (e.g. Mega Think Gas)" value={form.businessName} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" required />
              <input name="ownerName" placeholder="Your Full Name" value={form.ownerName} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" required />
              <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" required />
              <input name="phone" placeholder="Phone (e.g. 08012345678)" value={form.phone} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" required />
              <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" required />
              
              <button type="button" onClick={() => setStep(2)} className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl hover:bg-orange-400 transition flex items-center justify-center gap-2">
                Next <ChevronRight size={18} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-bold text-lg mb-1">Location</h2>
              <p className="text-gray-400 text-sm mb-4">Where is your shop located?</p>
              
              <input name="address" placeholder="Shop Address" value={form.address} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" required />
              <input name="city" placeholder="City" value={form.city} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
              <input name="state" placeholder="State" value={form.state} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
              <input name="deliveryFee" type="number" placeholder="Delivery Fee (N)" value={form.deliveryFee} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition flex items-center justify-center gap-2">
                  <ChevronLeft size={18} /> Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="flex-1 bg-orange-500 text-black font-bold py-3 rounded-xl hover:bg-orange-400 transition flex items-center justify-center gap-2">
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-bold text-lg mb-1">Set Your Prices</h2>
              <p className="text-gray-400 text-sm mb-4">How much do you charge per cylinder size?</p>
              
              <div className="space-y-3">
                {[
                  { size: '3kg', label: '3kg Cylinder', placeholder: 'e.g. 3500' },
                  { size: '5kg', label: '5kg Cylinder', placeholder: 'e.g. 5500' },
                  { size: '6kg', label: '6kg Cylinder', placeholder: 'e.g. 6500' },
                  { size: '12.5kg', label: '12.5kg Cylinder', placeholder: 'e.g. 12000' },
                  { size: '25kg', label: '25kg Cylinder', placeholder: 'e.g. 22000' },
                  { size: '50kg', label: '50kg Cylinder', placeholder: 'e.g. 40000' },
                ].map(({ size, label, placeholder }) => (
                  <div key={size} className="flex items-center gap-3">
                    <span className="text-gray-400 w-28 text-sm\">{label}</span>
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm\">N</span>
                      <input
                        name={`price_${size}`}
                        type="number"
                        placeholder={placeholder}
                        value={form.prices[size as keyof typeof form.prices]}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-3 mt-4">
                <p className="text-sm text-orange-400">
                  <strong>Tip:</strong> Set competitive prices. Most sellers in Ughelli charge N1,200-N1,600 per kg.
                </p>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition flex items-center justify-center gap-2">
                  <ChevronLeft size={18} /> Back
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-orange-500 text-black font-bold py-3 rounded-xl hover:bg-orange-400 transition disabled:opacity-50">
                  {loading ? 'Creating...' : 'Register Business'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Already have an account?{' '}
          <Link href="/seller/login" className="text-orange-400">Login</Link>
        </p>
      </div>
    </div>
  );
}
