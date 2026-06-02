"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { formatPrice } from "@/lib/gasCalculator";
import { Package, ChevronLeft, Phone, MapPin, CheckCircle, Truck, Flame, DollarSign, Banknote, Clock } from "lucide-react";

export type OrderStatus = "pending_payment" | "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "completed" | "cancelled";

export interface Order {
  id?: string; buyerId: string; buyerName: string; buyerPhone: string;
  sellerId: string; sellerName: string; sellerPhone: string;
  items: any[]; deliveryAddress: string; deliveryFee: number;
  subtotal: number; platformFee: number; sellerAmount: number; total: number;
  status: OrderStatus; paymentStatus: string; paystackRef?: string;
  createdAt: any; updatedAt: any; sellerSubaccount?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; nextAction: string; nextStatus: string; bg: string }> = {
  pending_payment: { label: "Awaiting Payment", color: "text-gray-400", nextAction: "", nextStatus: "", bg: "bg-gray-500/10" },
  pending: { label: "New Order", color: "text-yellow-400", nextAction: "Confirm Order", nextStatus: "confirmed", bg: "bg-yellow-500/10" },
  confirmed: { label: "Confirmed", color: "text-blue-400", nextAction: "Start Preparing", nextStatus: "preparing", bg: "bg-blue-500/10" },
  preparing: { label: "Preparing", color: "text-orange-400", nextAction: "Out for Delivery", nextStatus: "out_for_delivery", bg: "bg-orange-500/10" },
  out_for_delivery: { label: "Delivering", color: "text-purple-400", nextAction: "Mark Delivered", nextStatus: "delivered", bg: "bg-purple-500/10" },
  delivered: { label: "Delivered", color: "text-green-400", nextAction: "", nextStatus: "", bg: "bg-green-500/10" },
  completed: { label: "Completed & Paid", color: "text-green-400", nextAction: "", nextStatus: "", bg: "bg-green-500/10" },
  cancelled: { label: "Cancelled", color: "text-red-400", nextAction: "", nextStatus: "", bg: "bg-red-500/10" },
};

export default function SellerDashboardPage() {
  const [sellerPhone, setSellerPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "all">("active");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ogas_seller_phone");
    if (saved) { setSellerPhone(saved); setPhoneInput(saved); }
  }, []);

  useEffect(() => {
    if (!sellerPhone) return;
    const q = query(collection(db, "orders"), where("sellerPhone", "==", sellerPhone), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    });
    return () => unsubscribe();
  }, [sellerPhone]);

  const handleLogin = () => {
    if (phoneInput.length < 10) { alert("Enter a valid phone number"); return; }
    setSellerPhone(phoneInput); localStorage.setItem("ogas_seller_phone", phoneInput);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus, updatedAt: Timestamp.now() });
    } catch (err: any) { alert("Error: " + err.message); }
    finally { setUpdatingStatus(null); }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === "active") return ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"].includes(o.status);
    if (activeTab === "completed") return ["completed", "cancelled"].includes(o.status);
    return true;
  });

  const stats = {
    totalOrders: orders.length,
    active: orders.filter(o => ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"].includes(o.status)).length,
    completed: orders.filter(o => o.status === "completed").length,
    availableBalance: orders.filter(o => o.status === "completed" || (o.paymentStatus === "paid" && o.sellerSubaccount)).reduce((sum, o) => sum + (o.sellerAmount || 0) + (o.deliveryFee || 0), 0),
    pendingPayout: orders.filter(o => o.status === "delivered" && !o.sellerSubaccount).reduce((sum, o) => sum + (o.sellerAmount || 0) + (o.deliveryFee || 0), 0),
    totalRevenue: orders.filter(o => o.paymentStatus === "paid").reduce((sum, o) => sum + (o.sellerAmount || 0) + (o.deliveryFee || 0), 0),
  };

  if (!sellerPhone) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-4"><Flame className="w-8 h-8 text-orange-500" /></div>
        <h1 className="text-2xl font-bold text-white mb-2">Seller Dashboard</h1>
        <p className="text-gray-500 text-sm mb-6">Enter your registered phone number</p>
        <input type="tel" placeholder="08012345678" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className="w-full max-w-sm bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 mb-4" />
        <button onClick={handleLogin} className="w-full max-w-sm bg-orange-500 text-white rounded-xl py-3 font-semibold">Access Dashboard</button>
        <Link href="/" className="text-gray-500 text-sm mt-4">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="bg-gradient-to-b from-orange-900/20 to-black px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2 text-gray-400">
            <ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span>
          </Link>
          <button onClick={() => setSellerPhone("")} className="text-gray-500 text-xs">Logout</button>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-500 text-xs">{sellerPhone}</p>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3 mb-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Banknote className="w-4 h-4 text-green-500" /><span className="text-gray-500 text-xs">Available</span></div>
          <p className="text-2xl font-bold text-white">{formatPrice(stats.availableBalance)}</p>
          <p className="text-gray-600 text-xs mt-1">Paid to you</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-yellow-500" /><span className="text-gray-500 text-xs">Pending</span></div>
          <p className="text-2xl font-bold text-white">{formatPrice(stats.pendingPayout)}</p>
          <p className="text-gray-600 text-xs mt-1">Awaiting buyer confirmation</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-orange-500" /><span className="text-gray-500 text-xs">Total Revenue</span></div>
          <p className="text-2xl font-bold text-white">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-gray-600 text-xs mt-1">All-time earnings</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-blue-500" /><span className="text-gray-500 text-xs">Active Orders</span></div>
          <p className="text-2xl font-bold text-white">{stats.active}</p>
          <p className="text-gray-600 text-xs mt-1">Need attention</p>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="bg-black border border-gray-800 rounded-xl p-3">
          <p className="text-gray-500 text-xs flex items-start gap-2">
            <Banknote className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <span><span className="text-green-400 font-medium">Instant payouts:</span> With Paystack subaccount, you get paid instantly. <span className="text-yellow-400 font-medium">Escrow:</span> Without subaccount, paid after buyer confirms. <span className="text-orange-400 font-medium">OGas fee:</span> 10% per transaction.</span>
          </p>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex bg-dark-card border border-dark-border rounded-xl p-1">
          {(["active", "completed", "all"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? "bg-orange-500 text-white" : "text-gray-400"}`}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8"><Package className="w-12 h-12 text-gray-700 mx-auto mb-3" /><p className="text-gray-400 text-sm">No {activeTab} orders</p></div>
        ) : (
          filteredOrders.map(order => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const canUpdate = status.nextStatus !== "";
            const isPaid = order.paymentStatus === "paid";
            const hasSubaccount = !!order.sellerSubaccount;
            const payoutStatus = order.status === "completed" ? "paid" : (isPaid && hasSubaccount) ? "instant" : isPaid ? "pending_confirm" : "awaiting_payment";

            return (
              <div key={order.id} className="bg-dark-card border border-dark-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{order.buyerName}</p>
                    <p className="text-gray-500 text-xs">#{order.id?.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${status.bg} ${status.color}`}>{status.label}</span>
                    {isPaid && <p className="text-xs mt-1">
                      {payoutStatus === "paid" && <span className="text-green-400">Paid</span>}
                      {payoutStatus === "instant" && <span className="text-green-400">Instant</span>}
                      {payoutStatus === "pending_confirm" && <span className="text-yellow-400">Awaiting confirm</span>}
                      {payoutStatus === "awaiting_payment" && <span className="text-gray-500">Unpaid</span>}
                    </p>}
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items?.map((item: any, idx: number) => (
                    <p key={idx} className="text-gray-400 text-sm">{item.kg}kg x {item.quantity} = {formatPrice(item.kg * item.pricePerKg * item.quantity)}</p>
                  ))}
                </div>

                <div className="bg-black border border-gray-800 rounded-lg p-3 mb-3">
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Gas cost</span><span className="text-white">{formatPrice(order.subtotal)}</span></div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">OGas fee (10%)</span><span className="text-orange-400">-{formatPrice(order.platformFee)}</span></div>
                  {order.deliveryFee > 0 && <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Delivery fee</span><span className="text-white">+{formatPrice(order.deliveryFee)}</span></div>}
                  <div className="flex justify-between text-xs font-semibold border-t border-gray-800 pt-1 mt-1"><span className="text-green-400">You receive</span><span className="text-green-400">{formatPrice((order.sellerAmount || 0) + (order.deliveryFee || 0))}</span></div>
                </div>

                <div className="space-y-1 mb-3 text-xs">
                  <p className="text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {order.buyerPhone}</p>
                  <p className="text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.deliveryAddress}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dark-border">
                  <div>
                    <p className="text-orange-400 font-bold">{formatPrice(order.total)}</p>
                    <p className="text-gray-600 text-xs">Buyer paid</p>
                  </div>
                  {canUpdate && (
                    <button onClick={() => handleStatusUpdate(order.id!, status.nextStatus)} disabled={updatingStatus === order.id}
                      className="bg-orange-500 text-white text-xs font-medium px-4 py-2 rounded-lg active:scale-95 transition-transform disabled:opacity-50">
                      {updatingStatus === order.id ? "Updating..." : status.nextAction}
                    </button>
                  )}
                  {order.status === "delivered" && <div className="text-xs text-yellow-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Waiting for buyer confirmation</div>}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 pb-safe z-50">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2 text-gray-400"><span className="text-xl">🏠</span><span className="text-xs font-medium">Home</span></Link>
          <Link href="/buy" className="flex flex-col items-center p-2 text-gray-400"><span className="text-xl">🔥</span><span className="text-xs font-medium">Buy</span></Link>
          <Link href="/orders" className="flex flex-col items-center p-2 text-gray-400"><span className="text-xl">📦</span><span className="text-xs font-medium">Orders</span></Link>
          <Link href="/profile" className="flex flex-col items-center p-2 text-gray-400"><span className="text-xl">👤</span><span className="text-xs font-medium">Profile</span></Link>
        </div>
      </div>
    </div>
  );
}
