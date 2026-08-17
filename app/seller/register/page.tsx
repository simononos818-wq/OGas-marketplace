'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '../../context/AuthContext';
import { Store, MapPin, Phone, DollarSign, Truck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function SellerRegister() {
  const { user } = useAuthContext();
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [pricePerKg, setPricePerKg] = useState('1900');
  const [deliveryFee, setDeliveryFee] = useState('500');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toString());
          setLongitude(pos.coords.longitude.toString());
          setGettingLocation(false);
        },
        (err) => {
          alert('Could not get location: ' + err.message);
          setGettingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation not supported');
      setGettingLocation(false);
    }
  };

  const register = async () => {
    if (!user) return;
    if (!businessName || !address || !phone || !pricePerKg) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const sellerData = {
        businessName,
        address,
        phone,
        pricePerKg: parseFloat(pricePerKg),
        deliveryFee: parseFloat(deliveryFee) || 0,
        location: latitude && longitude ? {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address,
        } : null,
        ownerId: user.uid,
        ownerEmail: user.email,
        isOnline: true,
        isApproved: false,
        verified: false,
        sellerStatus: 'pending',
        statusBadge: 'Pending Approval',
        rating: 0,
        totalOrders: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'sellers', user.uid), sellerData);
      router.push('/seller/dashboard');
    } catch (err) {
      console.error(err);
      alert('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-lg">Register Your Store</h1>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Store className="w-4 h-4" />
              Business Name *
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Mega Think Success Gas"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <MapPin className="w-4 h-4" />
              Store Address *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Effurun Road, Warri"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Phone className="w-4 h-4" />
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 08012345678"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <DollarSign className="w-4 h-4" />
              Price per KG (₦) *
            </label>
            <input
              type="number"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
              placeholder="e.g. 1900"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-orange-400 mt-1">Customers will see ₦{parseFloat(pricePerKg || '0') - 50}/kg with OGas discount</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Truck className="w-4 h-4" />
              Delivery Fee (₦)
            </label>
            <input
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              placeholder="e.g. 500"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">Set to 0 if you only do pickup</p>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              GPS Location (for nearby buyers)
            </label>
            <button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="w-full bg-gray-800 hover:bg-gray-700 text-orange-400 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              {gettingLocation ? 'Getting Location...' : '📍 Get My Current Location'}
            </button>

            {latitude && longitude && (
              <div className="mt-2 p-3 bg-green-900/30 border border-green-800 rounded-xl">
                <p className="text-xs text-green-400">Location captured!</p>
                <p className="text-xs text-gray-400">Lat: {latitude}, Lng: {longitude}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2">
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Latitude"
                className="w-full bg-gray-800 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Longitude"
                className="w-full bg-gray-800 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <button
          onClick={register}
          disabled={loading}
          className="w-full bg-orange-500 text-black font-bold py-4 rounded-2xl text-lg hover:bg-orange-400 transition disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register Store'}
        </button>
      </div>
    </div>
  );
}
