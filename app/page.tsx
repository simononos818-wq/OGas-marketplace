'use client';

import Link from 'next/link';
import { Flame, MapPin, Shield, Zap, ArrowRight, Store, Truck, Star, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-black to-black" />
        <div className="relative px-4 pt-12 pb-16 max-w-lg mx-auto text-center">
          <div className="flex justify-center mb-6">
            <img src="/ogas-logo.svg" alt="OGas" className="h-14 w-auto" />
          </div>
          
          <h1 className="text-4xl font-bold leading-tight mb-3">
            Gas from your<br />
            <span className="text-orange-400">trusted neighbour</span>
          </h1>
          
          <p className="text-gray-400 text-lg mb-8">
            Order cooking gas from verified sellers near you. Safe, fast and at the price they set.
          </p>

          <div className="flex flex-col gap-3">
            <Link 
              href="/buy"
              className="w-full bg-orange-500 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg hover:bg-orange-400 transition"
            >
              Buy Gas Now
              <ArrowRight size={20} />
            </Link>
            
            <Link 
              href="/seller/register"
              className="w-full bg-gray-900 border border-gray-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 hover:border-orange-500/50 transition"
            >
              <Store size={18} />
              Become a Seller
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 text-center">
            <Shield className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-xs font-medium">Verified Sellers</p>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 text-center">
            <MapPin className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-xs font-medium">Nearby Only</p>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 text-center">
            <Zap className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-xs font-medium">Fast Delivery</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-10 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">How OGas Works</h2>
        
        <div className="space-y-4">
          <div className="flex gap-4 items-start bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="w-10 h-10 bg-orange-500 text-black font-bold rounded-full flex items-center justify-center shrink-0">1</div>
            <div>
              <h3 className="font-semibold">Find sellers near you</h3>
              <p className="text-sm text-gray-400 mt-1">We show verified neighbourhood sellers and gas plants around your location with their live prices.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="w-10 h-10 bg-orange-500 text-black font-bold rounded-full flex items-center justify-center shrink-0">2</div>
            <div>
              <h3 className="font-semibold">Choose & order</h3>
              <p className="text-sm text-gray-400 mt-1">Pick the size you need, choose pickup or delivery, and pay securely with Paystack or cash on delivery.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="w-10 h-10 bg-orange-500 text-black font-bold rounded-full flex items-center justify-center shrink-0">3</div>
            <div>
              <h3 className="font-semibold">Get your gas</h3>
              <p className="text-sm text-gray-400 mt-1">Seller accepts your order. Track it and confirm when you receive your cylinder safely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Sellers */}
      <section className="px-4 py-10 max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-orange-900/40 to-gray-900 border border-orange-500/30 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Store className="text-orange-400" size={22} />
            <h2 className="text-xl font-bold">Sell on OGas</h2>
          </div>
          <p className="text-gray-300 text-sm mb-5">
            Even if you only have 200kg of gas, you can sell at your own price. Verified neighbourhood sellers and gas plants are welcome.
          </p>
          
          <ul className="space-y-2 mb-6 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              Set your own prices
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              Accurate GPS verification
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              Get orders from people near you
            </li>
          </ul>

          <Link 
            href="/seller/register"
            className="block w-full bg-orange-500 text-black font-bold py-3.5 rounded-xl text-center"
          >
            Start Selling
          </Link>
        </div>
      </section>

      {/* Safety note */}
      <section className="px-4 pb-12 max-w-lg mx-auto text-center">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
          <Shield className="w-8 h-8 text-orange-400 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Safety First</h3>
          <p className="text-sm text-gray-400">
            Only verified sellers appear on OGas. We capture accurate location and require stock photos for every seller.
          </p>
        </div>
      </section>

      {/* Bottom spacing for nav */}
      <div className="h-8" />
    </div>
  );
}
