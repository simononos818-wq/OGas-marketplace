"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { NIGERIAN_CITIES } from "@/lib/gasCalculator";
import { ChevronLeft, Store, MapPin, Phone, Mail, DollarSign, Truck, CheckCircle, Flame, Banknote } from "lucide-react";

const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank" },
  { code: "050", name: "Ecobank" },
  { code: "011", name: "First Bank" },
  { code: "214", name: "First City Monument Bank (FCMB)" },
  { code: "070", name: "Fidelity Bank" },
  { code: "058", name: "Guaranty Trust Bank (GTB)" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "221", name: "Stanbic IBTC" },
  { code: "068", name: "Standard Chartered" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "SunTrust Bank" },
  { code: "032", name: "Union Bank" },
  { code: "033", name: "United Bank for Africa (UBA)" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
];

export default function SellerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sellerId, setSellerId] = useState("");

  const [form, setForm] = useState({
    name: "", phone: "", email: "", businessName: "", address: "", city: "", state: "",
    pricePerKg: "", availableSizes: [] as number[], deliveryAvailable: true, deliveryFee: "500",
    description: "", accountName: "", accountNumber: "", bankCode: "", bankName: "",
  });

  const cylinderSizes = [3, 5, 6, 10, 12.5, 15, 25, 50];

  const handleCitySelect = (cityName: string) => {
    const city = NIGERIAN_CITIES.find(c => c.name === cityName);
    if (city) setForm(prev => ({ ...prev, city: city.name, state: city.state }));
  };

  const handleBankSelect = (bankCode: string) => {
    const bank = NIGERIAN_BANKS.find(b => b.code === bankCode);
    if (bank) setForm(prev => ({ ...prev, bankCode: bank.code, bankName: bank.name }));
  };

  const toggleSize = (size: number) => {
    setForm(prev => ({ ...prev, availableSizes: prev.availableSizes.includes(size) ? prev.availableSizes.filter(s => s !== size) : [...prev.availableSizes, size] }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.businessName || !form.city || !form.pricePerKg) { alert("Please fill in all required fields"); return; }
    if (form.availableSizes.length === 0) { alert("Please select at least one cylinder size"); return; }
    if (!form.accountName || !form.accountNumber || !form.bankCode) { alert("Please add your bank details so you can receive payments"); return; }
    if (form.accountNumber.length < 10) { alert("Please enter a valid 10-digit account number"); return; }

    setSubmitting(true);
    try {
      const city = NIGERIAN_CITIES.find(c => c.name === form.city);
      const sellerData = {
        name: form.name, phone: form.phone, email: form.email || "",
        businessName: form.businessName, address: form.address, city: form.city, state: form.state,
        lat: city?.lat || 0, lng: city?.lng || 0, pricePerKg: Number(form.pricePerKg),
        availableSizes: form.availableSizes, deliveryAvailable: form.deliveryAvailable,
        deliveryFee: Number(form.deliveryFee) || 0, rating: 0, totalOrders: 0,
        isVerified: false, isActive: true, description: form.description,
        accountName: form.accountName, accountNumber: form.accountNumber,
        bankCode: form.bankCode, bankName: form.bankName,
        paystackSubaccountCode: null, createdAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "sellers"), sellerData);
      setSellerId(docRef.id); setSuccess(true);
    } catch (err: any) { alert("Error: " + err.message); }
    finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6"><CheckCircle className="w-10 h-10 text-green-500" /></div>
        <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
        <p className="text-gray-400 text-sm mb-2">Your seller ID: <span className="text-orange-400 font-mono">{sellerId.slice(-6).toUpperCase()}</span></p>
        <p className="text-gray-500 text-xs mb-2">We will review and activate your account within 24 hours.</p>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6 max-w-sm w-full">
          <p className="text-gray-400 text-xs mb-2">Your bank details on file:</p>
          <p className="text-white text-sm font-medium">{form.accountName}</p>
          <p className="text-gray-500 text-xs">{form.accountNumber} • {form.bankName}</p>
          <p className="text-orange-400 text-xs mt-2">You will receive 90% of each sale to this account after buyer confirms delivery.</p>
        </div>
        <button onClick={() => router.push("/")} className="w-full max-w-md bg-orange-500 text-white rounded-xl py-4 font-semibold">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="px-4 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-2 text-gray-400 mb-4"><ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center"><Store className="w-5 h-5 text-orange-500" /></div>
          <div><h1 className="text-xl font-bold text-white">Become a Seller</h1><p className="text-gray-500 text-xs">Step {step} of 4</p></div>
        </div>
      </div>
      <div className="px-4 mb-6"><div className="h-1 bg-dark-card rounded-full overflow-hidden"><div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} /></div></div>
      <div className="px-4 space-y-4">
        {step === 1 && (<><h2 className="text-white font-semibold mb-4">Personal Information</h2><div className="space-y-3">
          <div><label className="text-gray-500 text-xs mb-1 block">Full Name *</label><input type="text" placeholder="Your full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors" /></div>
          <div><label className="text-gray-500 text-xs mb-1 block">Phone Number *</label><input type="tel" placeholder="08012345678" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors" /></div>
          <div><label className="text-gray-500 text-xs mb-1 block">Email (optional)</label><input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors" /></div>
        </div></>)}
        {step === 2 && (<><h2 className="text-white font-semibold mb-4">Business Details</h2><div className="space-y-3">
          <div><label className="text-gray-500 text-xs mb-1 block">Business Name *</label><input type="text" placeholder="e.g. Moonlight Gas" value={form.businessName} onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors" /></div>
          <div><label className="text-gray-500 text-xs mb-1 block">City *</label><select value={form.city} onChange={e => handleCitySelect(e.target.value)} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm"><option value="">Select your city</option>{NIGERIAN_CITIES.map(c => (<option key={c.name} value={c.name}>{c.name}, {c.state}</option>))}</select></div>
          <div><label className="text-gray-500 text-xs mb-1 block">Shop Address *</label><textarea placeholder="e.g. 123 Effurun Market Road" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors resize-none" /></div>
          <div><label className="text-gray-500 text-xs mb-1 block">Price per kg (₦) *</label><input type="number" placeholder="1200" value={form.pricePerKg} onChange={e => setForm(p => ({ ...p, pricePerKg: e.target.value }))} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors" /></div>
        </div></>)}
        {step === 3 && (<><h2 className="text-white font-semibold mb-4">Services & Sizes</h2>
          <div className="mb-4"><label className="text-gray-500 text-xs mb-2 block">Cylinder Sizes You Sell *</label><div className="grid grid-cols-4 gap-2">{cylinderSizes.map(size => (<button key={size} onClick={() => toggleSize(size)} className={`p-3 rounded-xl border text-center transition-all ${form.availableSizes.includes(size) ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-dark-card border-dark-border text-gray-400"}`}><p className="font-bold text-sm">{size}kg</p></button>))}</div></div>
          <div className="mb-4"><label className="text-gray-500 text-xs mb-2 block">Delivery</label><div className="flex items-center gap-3 bg-dark-card border border-dark-border rounded-xl p-4"><input type="checkbox" checked={form.deliveryAvailable} onChange={e => setForm(p => ({ ...p, deliveryAvailable: e.target.checked }))} className="w-5 h-5 rounded border-gray-600 bg-black text-orange-500" /><div><p className="text-white text-sm font-medium">I offer delivery</p><p className="text-gray-500 text-xs">Deliver gas to customers</p></div></div></div>
          {form.deliveryAvailable && (<div className="mb-4"><label className="text-gray-500 text-xs mb-1 block">Delivery Fee (₦)</label><input type="number" placeholder="500" value={form.deliveryFee} onChange={e => setForm(p => ({ ...p, deliveryFee: e.target.value }))} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors" /></div>)}
          <div><label className="text-gray-500 text-xs mb-1 block">About Your Business (optional)</label><textarea placeholder="Tell customers about your gas business..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors resize-none" /></div>
        </>)}
        {step === 4 && (<><h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Banknote className="w-5 h-5 text-green-500" />Bank Details for Payouts</h2><p className="text-gray-500 text-xs mb-4">You will receive 90% of each sale (minus OGas 10% platform fee) to this account after the buyer confirms delivery.</p><div className="space-y-3">
          <div><label className="text-gray-500 text-xs mb-1 block">Bank Name *</label><select value={form.bankCode} onChange={e => handleBankSelect(e.target.value)} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm"><option value="">Select your bank</option>{NIGERIAN_BANKS.map(b => (<option key={b.code} value={b.code}>{b.name}</option>))}</select></div>
          <div><label className="text-gray-500 text-xs mb-1 block">Account Number *</label><input type="text" placeholder="0123456789" maxLength={10} value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, "") }))} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors" /></div>
          <div><label className="text-gray-500 text-xs mb-1 block">Account Name *</label><input type="text" placeholder="Name on your bank account" value={form.accountName} onChange={e => setForm(p => ({ ...p, accountName: e.target.value }))} className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-orange-500 transition-colors" /></div>
        </div>
          <div className="bg-black border border-gray-800 rounded-xl p-3 mt-4"><p className="text-gray-500 text-xs flex items-start gap-2"><Banknote className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /><span><span className="text-green-400 font-medium">How payouts work:</span><br />1. Buyer places order and pays full amount<br />2. You deliver the gas to buyer<br />3. Buyer confirms delivery in the app<br />4. OGas sends 90% to your bank account within 24 hours<br />5. OGas keeps 10% as platform fee</span></p></div>
        </>)}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 p-4 z-50">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 && (<button onClick={() => setStep(step - 1)} className="flex-1 bg-dark-card border border-dark-border text-white rounded-xl py-4 font-semibold">Back</button>)}
          {step < 4 ? (<button onClick={() => setStep(step + 1)} className="flex-1 bg-orange-500 text-white rounded-xl py-4 font-semibold">Continue</button>) : (<button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl py-4 font-semibold disabled:opacity-50">{submitting ? "Submitting..." : "Submit Application"}</button>)}
        </div>
      </div>
    </div>
  );
}
