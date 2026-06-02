"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { formatPrice } from "@/lib/gasCalculator";
import { Shield, ChevronLeft, CheckCircle, XCircle, MapPin, Phone, Star, Flame, AlertTriangle, Banknote, DollarSign } from "lucide-react";

interface Seller {
  id: string; name: string; phone: string; email: string; businessName: string;
  address: string; city: string; state: string; pricePerKg: number;
  availableSizes: number[]; deliveryAvailable: boolean; deliveryFee: number;
  isVerified: boolean; isActive: boolean; createdAt: any; description?: string;
  accountName?: string; accountNumber?: string; bankCode?: string; bankName?: string;
  paystackSubaccountCode?: string;
}

interface Order {
  id: string; buyerName: string; buyerPhone: string; sellerId: string; sellerName: string;
  status: string; paymentStatus: string; sellerAmount: number; deliveryFee: number;
  platformFee: number; total: number; subtotal: number; createdAt: any;
}

export default function AdminPage() {
  const [adminPin, setAdminPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingSellers, setPendingSellers] = useState<Seller[]>([]);
  const [verifiedSellers, setVerifiedSellers] = useState<Seller[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "verified" | "payouts">("pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const ADMIN_SECRET = "OGAS2026";

  useEffect(() => {
    if (!isAuthenticated) return;
    const pendingQuery = query(collection(db, "sellers"), where("isVerified", "==", false), where("isActive", "==", true));
    const unsubPending = onSnapshot(pendingQuery, (snapshot) => { setPendingSellers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Seller[]); });
    const verifiedQuery = query(collection(db, "sellers"), where("isVerified", "==", true), where("isActive", "==", true));
    const unsubVerified = onSnapshot(verifiedQuery, (snapshot) => { setVerifiedSellers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Seller[]); });
    const ordersQuery = query(collection(db, "orders"), where("paymentStatus", "==", "paid"));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => { setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]); });
    return () => { unsubPending(); unsubVerified(); unsubOrders(); };
  }, [isAuthenticated]);

  const handleLogin = () => { if (adminPin === ADMIN_SECRET) { setIsAuthenticated(true); localStorage.setItem("ogas_admin", "true"); } else { alert("Wrong PIN. Access denied."); } };
  const verifySeller = async (sellerId: string) => { try { await updateDoc(doc(db, "sellers", sellerId), { isVerified: true, verifiedAt: Timestamp.now(), verifiedBy: "admin" }); } catch (err: any) { alert("Error: " + err.message); } };
  const rejectSeller = async (sellerId: string) => { if (!confirm("Are you sure?")) return; try { await updateDoc(doc(db, "sellers", sellerId), { isActive: false, rejectedAt: Timestamp.now() }); } catch (err: any) { alert("Error: " + err.message); } };
  const deactivateSeller = async (sellerId: string) => { if (!confirm("Deactivate?")) return; try { await updateDoc(doc(db, "sellers", sellerId), { isActive: false, deactivatedAt: Timestamp.now() }); } catch (err: any) { alert("Error: " + err.message); } };
  const handleMarkPaid = async (orderId: string) => { if (!confirm("Have you transferred 90% to seller? Mark as paid?")) return; setMarkingPaid(orderId); try { await updateDoc(doc(db, "orders", orderId), { status: "completed", adminPaidOutAt: Timestamp.now(), updatedAt: Timestamp.now() }); alert("Marked as paid!"); } catch (err: any) { alert("Error: " + err.message); } finally { setMarkingPaid(null); } };

  useEffect(() => { if (localStorage.getItem("ogas_admin") === "true") setIsAuthenticated(true); }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-4"><Shield className="w-8 h-8 text-orange-500" /></div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-gray-500 text-sm mb-6">Enter admin PIN</p>
        <input type="password" placeholder="Enter PIN" value={adminPin} onChange={e => setAdminPin(e.target.value)} className="w-full max-w-sm bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 mb-4 text-center" />
        <button onClick={handleLogin} className="w-full max-w-sm bg-orange-500 text-white rounded-xl py-3 font-semibold">Access Panel</button>
        <Link href="/" className="text-gray-500 text-sm mt-4">Back to Home</Link>
      </div>
    );
  }

  const payoutOrders = orders.filter(o => o.status === "delivered" && o.paymentStatus === "paid");
  const completedOrders = orders.filter(o => o.status === "completed");
  const displaySellers = activeTab === "pending" ? pendingSellers : activeTab === "verified" ? verifiedSellers : [];

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="bg-gradient-to-b from-orange-900/20 to-black px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2 text-gray-400"><ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span></Link>
          <button onClick={() => { setIsAuthenticated(false); localStorage.removeItem("ogas_admin"); }} className="text-gray-500 text-xs">Logout</button>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
        <p className="text-gray-500 text-xs">Manage sellers & payouts</p>
      </div>

      <div className="px-4 grid grid-cols-4 gap-3 mb-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-3 text-center"><p className="text-2xl font-bold text-yellow-400">{pendingSellers.length}</p><p className="text-gray-500 text-xs">Pending</p></div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-3 text-center"><p className="text-2xl font-bold text-green-400">{verifiedSellers.length}</p><p className="text-gray-500 text-xs">Verified</p></div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-3 text-center"><p className="text-2xl font-bold text-orange-400">{payoutOrders.length}</p><p className="text-gray-500 text-xs">Need Payout</p></div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-3 text-center"><p className="text-2xl font-bold text-blue-400">{completedOrders.length}</p><p className="text-gray-500 text-xs">Completed</p></div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex bg-dark-card border border-dark-border rounded-xl p-1">
          {(["pending", "verified", "payouts"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-orange-500 text-white" : "text-gray-400"}`}>
              {tab === "pending" && `Pending (${pendingSellers.length})`}
              {tab === "verified" && `Verified (${verifiedSellers.length})`}
              {tab === "payouts" && `Payouts (${payoutOrders.length})`}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "payouts" && (
        <div className="px-4 space-y-3">
          <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4 text-orange-500" />Orders Ready for Payout</h2>
          <p className="text-gray-500 text-xs mb-3">These orders have been delivered and buyer confirmed. Transfer 90% to seller and mark as paid.</p>
          {payoutOrders.length === 0 ? (
            <div className="text-center py-8"><Banknote className="w-12 h-12 text-gray-700 mx-auto mb-3" /><p className="text-gray-400 text-sm">No payouts pending</p><p className="text-gray-600 text-xs">All caught up!</p></div>
          ) : (
            payoutOrders.map(order => {
              const seller = [...pendingSellers, ...verifiedSellers].find(s => s.id === order.sellerId);
              const payoutAmount = (order.sellerAmount || 0) + (order.deliveryFee || 0);
              return (
                <div key={order.id} className="bg-dark-card border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div><p className="text-white font-semibold text-sm">{order.sellerName}</p><p className="text-gray-500 text-xs">Order #{order.id?.slice(-6).toUpperCase()}</p></div>
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">Ready for Payout</span>
                  </div>
                  <div className="bg-black border border-gray-800 rounded-lg p-3 mb-3">
                    <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Gas cost</span><span className="text-white">{formatPrice(order.subtotal)}</span></div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">OGas fee (10%)</span><span className="text-orange-400">{formatPrice(order.platformFee)}</span></div>
                    {order.deliveryFee > 0 && <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Delivery</span><span className="text-white">{formatPrice(order.deliveryFee)}</span></div>}
                    <div className="flex justify-between text-sm font-semibold border-t border-gray-800 pt-1 mt-1"><span className="text-green-400">Pay seller</span><span className="text-green-400">{formatPrice(payoutAmount)}</span></div>
                  </div>
                  {seller && (
                    <div className="bg-black border border-gray-800 rounded-lg p-3 mb-3">
                      <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Banknote className="w-3 h-3" /> Seller Bank Details</p>
                      <p className="text-white text-sm font-medium">{seller.accountName}</p>
                      <p className="text-gray-400 text-xs">{seller.accountNumber}</p>
                      <p className="text-gray-400 text-xs">{seller.bankName}</p>
                    </div>
                  )}
                  <button onClick={() => handleMarkPaid(order.id)} disabled={markingPaid === order.id} className="w-full bg-green-500 text-white rounded-xl py-3 font-semibold text-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />{markingPaid === order.id ? "Marking..." : `I Have Paid Seller ${formatPrice(payoutAmount)}`}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {(activeTab === "pending" || activeTab === "verified") && (
        <div className="px-4 space-y-3">
          {displaySellers.length === 0 ? (
            <div className="text-center py-8"><Flame className="w-12 h-12 text-gray-700 mx-auto mb-3" /><p className="text-gray-400 text-sm">No {activeTab} sellers</p></div>
          ) : (
            displaySellers.map(seller => (
              <div key={seller.id} className="bg-dark-card border border-dark-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div><h3 className="text-white font-semibold text-sm">{seller.businessName}</h3><p className="text-gray-500 text-xs">{seller.name}</p></div>
                  {seller.isVerified ? (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-lg"><CheckCircle className="w-3 h-3" /> Verified</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg"><AlertTriangle className="w-3 h-3" /> Pending</span>
                  )}
                </div>
                <div className="space-y-1 text-xs mb-3">
                  <p className="text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {seller.phone}</p>
                  <p className="text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {seller.address}, {seller.city}, {seller.state}</p>
                  <p className="text-gray-500 flex items-center gap-1"><Star className="w-3 h-3" /> {formatPrice(seller.pricePerKg)}/kg</p>
                  <p className="text-gray-500">Sizes: {seller.availableSizes?.join(", ")}kg</p>
                  {seller.deliveryAvailable && <p className="text-green-400">Delivery: {formatPrice(seller.deliveryFee)}</p>}
                </div>
                <div className="bg-black border border-gray-800 rounded-lg p-3 mb-3">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Banknote className="w-3 h-3" /> Bank Details</p>
                  <p className="text-white text-sm font-medium">{seller.accountName || "Not provided"}</p>
                  <p className="text-gray-400 text-xs">{seller.accountNumber} • {seller.bankName}</p>
                  {seller.paystackSubaccountCode ? (<p className="text-green-400 text-xs mt-1">Paystack: {seller.paystackSubaccountCode}</p>) : (<p className="text-yellow-400 text-xs mt-1">No Paystack subaccount yet</p>)}
                </div>
                {activeTab === "pending" ? (
                  <div className="flex gap-2">
                    <button onClick={() => verifySeller(seller.id)} className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> Verify</button>
                    <button onClick={() => rejectSeller(seller.id)} className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1"><XCircle className="w-4 h-4" /> Reject</button>
                  </div>
                ) : (
                  <button onClick={() => deactivateSeller(seller.id)} className="w-full bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-2 text-sm font-medium">Deactivate Seller</button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
