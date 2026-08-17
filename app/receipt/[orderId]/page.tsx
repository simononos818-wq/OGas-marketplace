'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChevronLeft, Share2, CheckCircle, Printer, Phone, MapPin, Store, Calendar, Receipt } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerAddress: string;
  kgAmount: number;
  pricePerKg: number;
  gasCost: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryType: 'delivery' | 'pickup';
  paymentMethod: 'card' | 'cash';
  status: string;
  createdAt: any;
  transactionRef?: string;
}

export default function ReceiptPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      const snap = await getDoc(doc(db, 'orders', orderId as string));
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as Order);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-NG', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const shareReceipt = () => {
    if (!order) return;
    const text = `🧾 *OGas Receipt*\n\n` +
      `Order #: ${order.id.slice(-8).toUpperCase()}\n` +
      `Date: ${formatDate(order.createdAt)}\n` +
      `Status: ${order.status.toUpperCase()}\n\n` +
      `*Seller:* ${order.sellerName}\n` +
      `📍 ${order.sellerAddress}\n` +
      `📞 ${order.sellerPhone}\n\n` +
      `*Order Details:*\n` +
      `${order.kgAmount}kg × ₦${order.pricePerKg.toLocaleString()}/kg = ₦${order.gasCost.toLocaleString()}\n` +
      `Delivery: ${order.deliveryType === 'pickup' ? 'FREE (Pickup)' : '₦' + order.deliveryFee.toLocaleString()}\n` +
      `*Total: ₦${order.totalAmount.toLocaleString()}*\n\n` +
      `Payment: ${order.paymentMethod === 'card' ? 'Card (Paid)' : 'Cash on ' + order.deliveryType}\n` +
      `${order.transactionRef ? 'Ref: ' + order.transactionRef : ''}\n\n` +
      `Thank you for using OGas! 🔥\n` +
      `www.ogaslpgmarketplace.com`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const printReceipt = () => window.print();

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">
      Order not found
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-500" /> Receipt
          </h1>
          <div className="flex gap-2">
            <button onClick={shareReceipt} className="p-2 bg-green-600 hover:bg-green-500 rounded-full" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={printReceipt} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full" title="Print">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 print:bg-white print:text-black print:border-black">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-black font-black text-lg">O</span>
              </div>
              <span className="font-black text-xl tracking-tight">OGas</span>
            </div>
            <p className="text-gray-400 text-sm print:text-gray-600">Official Receipt</p>
            <div className="mt-3 inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" /> {order.status.toUpperCase()}
            </div>
          </div>

          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400 print:text-gray-600">Order #</span>
              <span className="font-mono">{order.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 print:text-gray-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            {order.transactionRef && (
              <div className="flex justify-between">
                <span className="text-gray-400 print:text-gray-600">Transaction Ref</span>
                <span className="font-mono text-xs">{order.transactionRef}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-800 my-4 print:border-gray-300"></div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sold By</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-bold">{order.sellerName}</p>
                <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {order.sellerAddress}
                </p>
                <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> {order.sellerPhone}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 my-4 print:border-gray-300"></div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer</h3>
            <p className="font-bold">{order.buyerName}</p>
            <p className="text-gray-400 text-sm">{order.buyerPhone}</p>
          </div>

          <div className="border-t border-gray-800 my-4 print:border-gray-300"></div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Order Details</h3>
            <div className="bg-gray-800/50 rounded-xl p-4 print:bg-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span>LPG Gas Refill</span>
                <span className="font-bold">{order.kgAmount}kg</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>₦{order.pricePerKg.toLocaleString()} × {order.kgAmount}kg</span>
                <span>₦{order.gasCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-400">Delivery Type</span>
            <span className="capitalize">{order.deliveryType}</span>
          </div>
          <div className="flex justify-between items-center mb-4 text-sm">
            <span className="text-gray-400">Delivery Fee</span>
            <span>{order.deliveryType === 'pickup' ? 'FREE' : `₦${order.deliveryFee.toLocaleString()}`}</span>
          </div>

          <div className="border-t border-gray-800 my-4 print:border-gray-300"></div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span>₦{order.gasCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Delivery</span>
              <span>{order.deliveryType === 'pickup' ? 'FREE' : `₦${order.deliveryFee.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-800 print:border-gray-300">
              <span>Total Paid</span>
              <span className="text-orange-500 print:text-black">₦{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 text-center print:bg-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Method</p>
            <p className="font-bold">
              {order.paymentMethod === 'card' ? '💳 Card Payment (Paid Online)' : '💵 Cash on ' + order.deliveryType}
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">Thank you for using OGas!</p>
            <p className="text-xs text-gray-600 mt-1">www.ogaslpgmarketplace.com</p>
            <p className="text-xs text-gray-600">support@ogaslpgmarketplace.com</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 print:hidden">
          <button onClick={shareReceipt}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" /> Share Receipt on WhatsApp
          </button>
          <button onClick={printReceipt}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
            <Printer className="w-5 h-5" /> Print Receipt
          </button>
          <Link href="/orders"
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
            <Receipt className="w-5 h-5" /> View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
