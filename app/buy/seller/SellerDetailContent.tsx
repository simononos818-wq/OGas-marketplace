'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const SELLERS: Record<string, any> = {
  seller_1: {
    businessName: 'Moonlight Gas',
    address: 'UTI off PTI Road, Oteri',
    phone: '07067656577',
    pricePerKg: 1200,
    minOrderKg: 5,
    maxOrderKg: 50,
    deliveryAvailable: true,
    deliveryFee: 500,
    rating: 4.8,
    ordersCompleted: 47,
    verified: true,
    description: 'Reliable gas delivery in Oteri and surrounding areas. We fill your cylinder at your doorstep.',
  },
  seller_2: {
    businessName: 'D Gold Gas',
    address: 'Ughelli Patani Road',
    phone: '08148939250',
    pricePerKg: 1150,
    minOrderKg: 3,
    maxOrderKg: 100,
    deliveryAvailable: true,
    deliveryFee: 300,
    rating: 4.5,
    ordersCompleted: 23,
    verified: true,
    description: 'Best prices in Ughelli. Fast delivery, quality gas guaranteed.',
  },
  seller_3: {
    businessName: 'Total Gas Station - Ikeja',
    address: 'Ikeja, Lagos',
    phone: '09133110237',
    pricePerKg: 1250,
    minOrderKg: 10,
    maxOrderKg: 200,
    deliveryAvailable: false,
    deliveryFee: 0,
    rating: 4.2,
    ordersCompleted: 156,
    verified: false,
    description: 'Large scale gas station. Come fill up at our station.',
  },
  seller_4: {
    businessName: 'Delta Flame Gas',
    address: 'Effurun Market Road',
    phone: '08034567890',
    pricePerKg: 1100,
    minOrderKg: 2,
    maxOrderKg: 30,
    deliveryAvailable: true,
    deliveryFee: 400,
    rating: 4.9,
    ordersCompleted: 89,
    verified: true,
    description: 'Premium gas at affordable prices. Serving Effurun and Warri.',
  },
};

export default function SellerDetailContent() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get('id') || 'seller_1';
  const seller = SELLERS[sellerId] || SELLERS['seller_1'];
  
  const [kg, setKg] = useState(seller.minOrderKg);
  const [delivery, setDelivery] = useState(seller.deliveryAvailable);
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = kg * seller.pricePerKg;
  const deliveryFee = delivery ? seller.deliveryFee : 0;
  const total = subtotal + deliveryFee;
  const platformFee = Math.round(total * 0.02);

  const handlePlaceOrder = async () => {
    if (!phone || (delivery && !address)) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const orderData = {
        sellerId,
        sellerName: seller.businessName,
        sellerPhone: seller.phone,
        buyerPhone: phone,
        buyerLat: null,
        buyerLng: null,
        kg,
        pricePerKg: seller.pricePerKg,
        subtotal,
        deliveryFee,
        platformFee,
        total: total + platformFee,
        delivery,
        address: delivery ? address : seller.address,
        notes: notes || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(docRef.id);
      setPlaced(true);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (placed) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center pb-20 px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-orange-500 mb-2">Order Placed!</h2>
          <p className="text-gray-400 mb-4">
            {seller.businessName} will contact you shortly.
          </p>
          <div className="bg-gray-900 rounded-2xl p-4 mb-4 text-left">
            <p className="text-gray-400 text-sm">Order ID: <span className="font-mono text-xs">{orderId}</span></p>
            <p className="text-white font-bold mt-1">{kg}kg × ₦{seller.pricePerKg.toLocaleString()} = ₦{subtotal.toLocaleString()}</p>
            <p className="text-gray-400 text-sm mt-1">Total: ₦{(total + platformFee).toLocaleString()}</p>
          </div>
          <Link href="/orders" className="block bg-orange-500 text-white py-3 rounded-2xl font-bold mb-3">
            View My Orders
          </Link>
          <Link href="/buy" className="block text-gray-400 py-2">
            ← Back to Sellers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="p-4 border-b border-gray-800">
        <Link href="/buy" className="text-gray-400 text-sm mb-2 block">← Back to Sellers</Link>
        <h1 className="text-2xl font-bold">{seller.businessName}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-yellow-400 text-sm">⭐ {seller.rating}</span>
          <span className="text-gray-500 text-sm">{seller.ordersCompleted} orders</span>
          {seller.verified && <span className="text-blue-400 text-xs bg-blue-400/10 px-2 py-1 rounded-full">✓ Verified</span>}
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-gray-300 text-sm">{seller.description}</p>
          <div className="mt-3 space-y-1">
            <p className="text-gray-400 text-sm">📍 {seller.address}</p>
            <p className="text-gray-400 text-sm">📞 {seller.phone}</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <h3 className="font-bold mb-4">Select Quantity</h3>
          <div className="flex items-center justify-center gap-6">
            <button onClick={() => setKg(Math.max(seller.minOrderKg, kg - 1))} className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">−</button>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{kg}</div>
              <div className="text-gray-500 text-sm">kg</div>
            </div>
            <button onClick={() => setKg(Math.min(seller.maxOrderKg, kg + 1))} className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">+</button>
          </div>
          <p className="text-orange-500 font-bold text-2xl text-center mt-4">₦{subtotal.toLocaleString()}</p>
          <p className="text-gray-500 text-xs text-center">₦{seller.pricePerKg.toLocaleString()} per kg</p>
        </div>

        {seller.deliveryAvailable && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <h3 className="font-bold mb-3">Delivery Option</h3>
            <button onClick={() => setDelivery(true)} className={`w-full p-4 rounded-xl border text-left transition mb-2 ${delivery ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700'}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium">🚚 Home Delivery</span>
                <span className="text-orange-500 font-bold">₦{seller.deliveryFee.toLocaleString()}</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">Delivered to your doorstep</p>
            </button>
            <button onClick={() => setDelivery(false)} className={`w-full p-4 rounded-xl border text-left transition ${!delivery ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700'}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium">🏪 Pickup at Station</span>
                <span className="text-green-400 font-bold">Free</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">Come fill at {seller.businessName}</p>
            </button>
          </div>
        )}

        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <h3 className="font-bold mb-3">Your Details</h3>
          <input type="tel" placeholder="Your phone number *" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white mb-3 focus:border-orange-500 outline-none" />
          {delivery && <input type="text" placeholder="Delivery address *" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white mb-3 focus:border-orange-500 outline-none" />}
          <textarea placeholder="Order notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white h-20 focus:border-orange-500 outline-none resize-none" />
        </div>

        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <h3 className="font-bold mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>Gas ({kg}kg)</span><span>₦{subtotal.toLocaleString()}</span></div>
            {delivery && <div className="flex justify-between text-gray-400"><span>Delivery</span><span>₦{deliveryFee.toLocaleString()}</span></div>}
            <div className="flex justify-between text-gray-400"><span>Platform Fee (2%)</span><span>₦{platformFee.toLocaleString()}</span></div>
            <div className="border-t border-gray-700 pt-2 flex justify-between font-bold text-lg"><span className="text-white">Total</span><span className="text-orange-500">₦{(total + platformFee).toLocaleString()}</span></div>
          </div>
        </div>

        <button onClick={handlePlaceOrder} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition">
          {loading ? 'Placing Order...' : 'Place Order →'}
        </button>
        <p className="text-gray-500 text-xs text-center">Cash on delivery. Pay when you receive your gas.</p>
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
