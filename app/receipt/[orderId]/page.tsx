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
    <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#12a5b0]"></div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center text-[#8a8f98]">
      Order not found
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#16305e]">
      <div className="sticky top-0 bg-[#f4f6f8]/90 backdrop-blur-md border-b border-[#e6e9ee] z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#e6e9ee] rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#12a5b0]" /> Receipt
          </h1>
          <div className="flex gap-2">
            <button onClick={shareReceipt} className="p-2 bg-green-600 hover:bg-green-500 rounded-full" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={printReceipt} className="p-2 bg-[#e6e9ee] hover:bg-[#d3dbe4] rounded-full" title="Print">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-6 border border-[#e6e9ee] print:bg-white print:text-[#16305e] print:border-black">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-[#12a5b0] rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-lg">O</span>
              </div>
              <span className="font-black text-xl tracking-tight">OGas</span>
            </div>
            <p className="text-[#8a8f98] text-sm print:text-[#5b616b]">Official Receipt</p>
            <div className="mt-3 inline-flex items-center gap-1 bg-green-500/20 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" /> {order.status.toUpperCase()}
            </div>
          </div>

          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8a8f98] print:text-[#5b616b]">Order #</span>
              <span className="font-mono">{order.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a8f98] print:text-[#5b616b] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            {order.transactionRef && (
              <div className="flex justify-between">
                <span className="text-[#8a8f98] print:text-[#5b616b]">Transaction Ref</span>
                <span className="font-mono text-xs">{order.transactionRef}</span>
              </div>
            )}
          </div>

          <div className="border-t border-[#e6e9ee] my-4 print:border-gray-300"></div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-[#8a8f98] uppercase tracking-wider mb-2">Sold By</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#12a5b0]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-[#12a5b0]" />
              </div>
              <div>
                <p className="font-bold">{order.sellerName}</p>
                <p className="text-[#8a8f98] text-sm flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {order.sellerAddress}
                </p>
                <p className="text-[#8a8f98] text-sm flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> {order.sellerPhone}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e6e9ee] my-4 print:border-gray-300"></div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-[#8a8f98] uppercase tracking-wider mb-2">Customer</h3>
            <p className="font-bold">{order.buyerName}</p>
            <p className="text-[#8a8f98] text-sm">{order.buyerPhone}</p>
          </div>

          <div className="border-t border-[#e6e9ee] my-4 print:border-gray-300"></div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-[#8a8f98] uppercase tracking-wider mb-3">Order Details</h3>
            <div className="bg-[#e6e9ee]/50 rounded-xl p-4 print:bg-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span>LPG Gas Refill</span>
                <span className="font-bold">{order.kgAmount}kg</span>
              </div>
              <div className="flex justify-between text-sm text-[#8a8f98]">
                <span>₦{order.pricePerKg.toLocaleString()} × {order.kgAmount}kg</span>
                <span>₦{order.gasCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-[#8a8f98]">Delivery Type</span>
            <span className="capitalize">{order.deliveryType}</span>
          </div>
          <div className="flex justify-between items-center mb-4 text-sm">
            <span className="text-[#8a8f98]">Delivery Fee</span>
            <span>{order.deliveryType === 'pickup' ? 'FREE' : `₦${order.deliveryFee.toLocaleString()}`}</span>
          </div>

          <div className="border-t border-[#e6e9ee] my-4 print:border-gray-300"></div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-[#8a8f98]">Subtotal</span>
              <span>₦{order.gasCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a8f98]">Delivery</span>
              <span>{order.deliveryType === 'pickup' ? 'FREE' : `₦${order.deliveryFee.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#e6e9ee] print:border-gray-300">
              <span>Total Paid</span>
              <span className="text-[#12a5b0] print:text-[#16305e]">₦{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-[#e6e9ee]/50 rounded-xl p-4 text-center print:bg-gray-100">
            <p className="text-xs text-[#8a8f98] uppercase tracking-wider mb-1">Payment Method</p>
            <p className="font-bold">
              {order.paymentMethod === 'card' ? '💳 Card Payment (Paid Online)' : '💵 Cash on ' + order.deliveryType}
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#8a8f98]">Thank you for using OGas!</p>
            <p className="text-xs text-[#5b616b] mt-1">www.ogaslpgmarketplace.com</p>
            <p className="text-xs text-[#5b616b]">support@ogaslpgmarketplace.com</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 print:hidden">
          <button onClick={shareReceipt}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" /> Share Receipt on WhatsApp
          </button>
          <button onClick={printReceipt}
            className="w-full bg-[#e6e9ee] hover:bg-[#d3dbe4] text-[#16305e] font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
            <Printer className="w-5 h-5" /> Print Receipt
          </button>
          <Link href="/orders"
            className="w-full bg-[#12a5b0] hover:bg-[#0e8a94] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
            <Receipt className="w-5 h-5" /> View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
