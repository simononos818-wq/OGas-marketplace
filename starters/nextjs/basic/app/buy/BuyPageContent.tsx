'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Fallback mock sellers - ALWAYS show these if Firestore fails
const FALLBACK_SELLERS = [
  {
    id: 'seller_1',
    businessName: 'Moonlight Gas',
    address: 'UTI off PTI Road, Oteri',
    phone: '07067656577',
    pricePerKg: 1200,
    minOrderKg: 5,
    deliveryAvailable: true,
    deliveryFee: 500,
    rating: 4.8,
    ordersCompleted: 47,
    verified: true,
  },
  {
    id: 'seller_2',
    businessName: 'D Gold Gas',
    address: 'Ughelli Patani Road',
    phone: '08148939250',
    pricePerKg: 1150,
    minOrderKg: 3,
    deliveryAvailable: true,
    deliveryFee: 300,
    rating: 4.5,
    ordersCompleted: 23,
    verified: true,
  },
  {
    id: 'seller_3',
    businessName: 'Total Gas Station - Ikeja',
    address: 'Ikeja, Lagos',
    phone: '09133110237',
    pricePerKg: 1250,
    minOrderKg: 10,
    deliveryAvailable: false,
    deliveryFee: 0,
    rating: 4.2,
    ordersCompleted: 156,
    verified: false,
  },
  {
    id: 'seller_4',
    businessName: 'Delta Flame Gas',
    address: 'Effurun Market Road',
    phone: '08034567890',
    pricePerKg: 1100,
    minOrderKg: 2,
    deliveryAvailable: true,
    deliveryFee: 400,
    rating: 4.9,
    ordersCompleted: 89,
    verified: true,
  },
];

export default function BuyPageContent() {
  const [sellers, setSellers] = useState<any[]>(FALLBACK_SELLERS); // Start with fallback
  const [location, setLocation] = useState('Oteri, Ughelli');
  const [loading, setLoading] = useState(true);
  const [usingFirestore, setUsingFirestore] = useState(false);

  useEffect(() => {
    // Get location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`);
            const data = await res.json();
            setLocation(data.display_name?.split(',')[0] || 'Your Location');
          } catch {
            setLocation('Your Location');
          }
        },
        () => setLocation('Oteri, Ughelli'),
        { timeout: 5000 }
      );
    }

    // Try to fetch from Firestore
    try {
      const q = query(collection(db, 'sellers'), where('status', '==', 'verified'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const sellersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        if (sellersData.length > 0) {
          setSellers(sellersData);
          setUsingFirestore(true);
        }
        // If Firestore returns empty, keep fallback sellers
        
        setLoading(false);
      }, (error) => {
        console.log('Firestore error, using fallback:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.log('Firestore not available, using fallback');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🔥</div>
          <p className="text-gray-400">Finding sellers near you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 text-orange-500 text-sm mb-1">
          <span>📍</span>
          <span>{location}</span>
        </div>
        <h1 className="text-2xl font-bold">🔥 Order Gas</h1>
        <p className="text-gray-400 text-sm mt-1">{sellers.length} sellers available {usingFirestore && '• Live'}</p>
      </div>

      <div className="p-4 flex gap-2 overflow-x-auto">
        <button className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap">All Sellers</button>
        <button className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap">Delivery</button>
        <button className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap">Pickup</button>
        <button className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap">Verified</button>
      </div>

      <div className="px-4 space-y-4">
        {sellers.map((seller: any) => (
          <Link key={seller.id} href={`/buy/seller?id=${seller.id}`} className="block bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-orange-500/50 transition">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-white">{seller.businessName}</h3>
                  {seller.verified && <span className="text-blue-400 text-xs">✓ Verified</span>}
                </div>
                <p className="text-gray-400 text-sm mt-1">📍 {seller.address}</p>
                <p className="text-gray-500 text-xs mt-1">📞 {seller.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-500 font-bold text-xl">₦{seller.pricePerKg?.toLocaleString()}</p>
                <p className="text-gray-500 text-xs">per kg</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-yellow-400 text-sm">⭐ {seller.rating || 4.5}</span>
              <span className="text-gray-500 text-sm">| {seller.ordersCompleted || 0} orders</span>
              {seller.deliveryAvailable ? (
                <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded-full">🚚 Delivery</span>
              ) : (
                <span className="text-orange-400 text-xs bg-orange-400/10 px-2 py-1 rounded-full">🏪 Pickup</span>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
              <span className="text-gray-400 text-sm">Min: {seller.minOrderKg || 5}kg</span>
              <span className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold">Order Now →</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 pb-safe">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2 text-gray-400"><span className="text-xl">🏠</span><span className="text-xs font-medium">Home</span></Link>
          <Link href="/buy" className="flex flex-col items-center p-2 text-orange-500"><span className="text-xl">🔥</span><span className="text-xs font-medium">Buy</span></Link>
          <Link href="/orders" className="flex flex-col items-center p-2 text-gray-400"><span className="text-xl">📦</span><span className="text-xs font-medium">Orders</span></Link>
          <Link href="/profile" className="flex flex-col items-center p-2 text-gray-400"><span className="text-xl">👤</span><span className="text-xs font-medium">Profile</span></Link>
        </div>
      </div>
    </div>
  );
}
