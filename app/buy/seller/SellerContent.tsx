'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = 'https://us-central1-ogasapp-5a003.cloudfunctions.net';
const BUYER_PHONE_KEY = 'ogas_buyer_phone';
const BUYER_NAME_KEY = 'ogas_buyer_name';

interface Seller {
  id: string;
  businessName: string;
  phone: string;
  address: string;
  prices: Record<string, number>;
  gasSizes: string[];
  hasDelivery: boolean;
  deliveryFee: number;
  rating: number;
}

export default function SellerContent() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get('id');
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'paystack'>('cash_on_delivery');
  const [notes, setNotes] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatId, setChatId] = useState('');

  useEffect(() => {
    const savedName = localStorage.getItem(BUYER_NAME_KEY) || '';
    const savedPhone = localStorage.getItem(BUYER_PHONE_KEY) || '';
    setBuyerName(savedName);
    setBuyerPhone(savedPhone);
    
    async function load() {
      try {
        const res = await fetch(`${API_URL}/getVendors`);
        const data = await res.json();
        const found = data.vendors?.find((v: Seller) => v.id === sellerId);
        setSeller(found || null);
        if (found) {
          setChatId(`chat_${sellerId}_${savedPhone || 'guest'}`);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sellerId]);

  useEffect(() => {
    if (showChat && chatId) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [showChat, chatId]);

  async function loadMessages() {
    try {
      const res = await fetch(`${API_URL}/getMessages?chatId=${chatId}`);
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function sendChatMessage() {
    if (!chatText.trim() || !chatId) return;
    try {
      await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          senderId: buyerPhone || 'guest',
          senderName: buyerName || 'Buyer',
          senderRole: 'buyer',
          text: chatText,
        }),
      });
      setChatText('');
      loadMessages();
    } catch (e) {
      console.error(e);
    }
  }

  async function placeOrder() {
    if (!buyerName || !buyerPhone || !selectedSize) return;
    
    localStorage.setItem(BUYER_NAME_KEY, buyerName);
    localStorage.setItem(BUYER_PHONE_KEY, buyerPhone);

    const pricePerUnit = seller?.prices[selectedSize] || 0;
    const delivery = seller?.hasDelivery ? (seller?.deliveryFee || 0) : 0;
    const total = (pricePerUnit * quantity) + delivery;

    try {
      const res = await fetch(`${API_URL}/createOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName,
          buyerPhone,
          buyerAddress,
          sellerId,
          sellerName: seller?.businessName,
          size: selectedSize,
          quantity,
          pricePerUnit,
          deliveryFee: delivery,
          total,
          paymentMethod,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderId(data.orderId);
        setOrderSuccess(true);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white p-4 flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"></div></div>;
  if (!seller) return <div className="min-h-screen bg-gray-950 text-white p-4">Seller not found</div>;

  const total = selectedSize ? (seller.prices[selectedSize] || 0) * quantity + (seller.hasDelivery ? seller.deliveryFee : 0) : 0;

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
          <p className="text-gray-400 mb-2">Order ID: <span className="text-orange-400 font-mono">{orderId.slice(-6)}</span></p>
          <p className="text-gray-500 text-sm mb-6">{seller.businessName} will contact you shortly.</p>
          <div className="space-y-3">
            <button onClick={() => setShowChat(true)} className="block w-full bg-green-500 text-white py-3 rounded-xl font-bold">Chat with Seller</button>
            <Link href="/orders" className="block w-full bg-gray-800 text-white py-3 rounded-xl font-bold">View My Orders</Link>
            <Link href="/buy" className="block text-gray-400 text-sm">Back to Sellers</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-24">
      <Link href="/buy" className="text-gray-400 text-sm mb-4 block">← Back to sellers</Link>
      
      <h1 className="text-2xl font-bold mb-2">{seller.businessName}</h1>
      <p className="text-gray-400 text-sm mb-1">📍 {seller.address}</p>
      <p className="text-gray-400 text-sm mb-4">⭐ {seller.rating} rating • 📞 {seller.phone}</p>

      {!showOrderForm ? (
        <>
          <h2 className="text-lg font-bold mb-3">Select Size</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {seller.gasSizes.map(size => (
              <button key={size} onClick={() => { setSelectedSize(size); setShowOrderForm(true); }} className={`p-4 rounded-xl border text-center transition ${selectedSize === size ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-300'}`}>
                <p className="font-bold text-lg">{size}kg</p>
                <p className="text-sm">₦{seller.prices[size]?.toLocaleString()}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setShowChat(true)} className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold mb-3">💬 Chat with Seller</button>
        </>
      ) : (
        <>
          <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Selected</p>
            <p className="font-bold text-lg">{selectedSize}kg × {quantity} = ₦{((seller.prices[selectedSize] || 0) * quantity).toLocaleString()}</p>
            <button onClick={() => setShowOrderForm(false)} className="text-orange-400 text-xs mt-2">Change size</button>
          </div>

          <h2 className="text-lg font-bold mb-3">Your Details</h2>
          <div className="space-y-3 mb-4">
            <input type="text" required value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white" placeholder="Your full name *" />
            <input type="tel" required value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white" placeholder="Your phone number *" />
            <input type="text" value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white" placeholder="Delivery address" />
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white" rows={2} placeholder="Any special instructions..." />
          </div>

          <h2 className="text-lg font-bold mb-3">Payment</h2>
          <div className="space-y-2 mb-6">
            <button onClick={() => setPaymentMethod('cash_on_delivery')} className={`w-full p-4 rounded-xl border text-left transition ${paymentMethod === 'cash_on_delivery' ? 'bg-orange-500/20 border-orange-500' : 'bg-gray-900 border-gray-800'}`}>
              <p className="font-bold">💵 Cash on Delivery</p>
              <p className="text-sm text-gray-400">Pay when gas is delivered</p>
            </button>
            <button onClick={() => setPaymentMethod('paystack')} className={`w-full p-4 rounded-xl border text-left transition ${paymentMethod === 'paystack' ? 'bg-orange-500/20 border-orange-500' : 'bg-gray-900 border-gray-800'}`}>
              <p className="font-bold">💳 Pay with Card (Paystack)</p>
              <p className="text-sm text-gray-400">Secure online payment</p>
            </button>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800">
            <div className="flex justify-between mb-2"><span className="text-gray-400">Gas</span><span>₦{((seller.prices[selectedSize] || 0) * quantity).toLocaleString()}</span></div>
            {seller.hasDelivery && <div className="flex justify-between mb-2"><span className="text-gray-400">Delivery</span><span>₦{seller.deliveryFee.toLocaleString()}</span></div>}
            <div className="flex justify-between pt-2 border-t border-gray-700 font-bold text-lg"><span>Total</span><span className="text-orange-400">₦{total.toLocaleString()}</span></div>
          </div>

          <button onClick={placeOrder} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-lg transition mb-3">Place Order</button>
          <button onClick={() => setShowOrderForm(false)} className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold">Cancel</button>
        </>
      )}

      {showChat && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-gray-800">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-bold">💬 Chat with {seller.businessName}</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {chatMessages.length === 0 && <p className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderRole === 'buyer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 ${msg.senderRole === 'buyer' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-200'}`}>
                    <p className="text-xs opacity-70 mb-1">{msg.senderName}</p>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-800 flex gap-2">
              <input type="text" value={chatText} onChange={e => setChatText(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendChatMessage()} className="flex-1 bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm" placeholder="Type a message..." />
              <button onClick={sendChatMessage} className="bg-orange-500 text-white px-4 rounded-xl font-bold">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
