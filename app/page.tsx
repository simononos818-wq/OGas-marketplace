'use client';

import Link from 'next/link';
import { Flame, MapPin, Truck, Phone, Navigation, Star, ChevronRight } from 'lucide-react';
import BottomNav from '@/app/components/MobileNav';
import SupportButton from '@/app/components/SupportButton';
import Fab from '@/app/components/Fab';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 pb-24">
      <header className="fixed top-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800 z-40 pt-safe">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">OGas</span>
          </div>
          <Link href="/profile" className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">Me</span>
          </Link>
        </div>
      </header>

      <section className="pt-20 px-4 space-y-6">
        <div className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-3 border border-zinc-800">
          <div className="w-10 h-10 bg-orange-500/15 rounded-full flex items-center justify-center">
            <Navigation className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-zinc-500">Your location</p>
            <p className="text-sm font-semibold">Detecting...</p>
          </div>
          <button className="text-orange-400 text-sm font-medium">Update</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/buy" className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 space-y-3 active:scale-95 transition-transform">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">Buy Gas</p>
              <p className="text-xs text-white/70">Find sellers near you</p>
            </div>
          </Link>
          
          <Link href="/business" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 active:scale-95 transition-transform">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="font-bold text-white">Sell Gas</p>
              <p className="text-xs text-zinc-500">Become a vendor</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: '500+', label: 'Sellers' },
            { value: '30m', label: 'Delivery' },
            { value: '4.8', label: 'Rating' },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-orange-400">{stat.value}</p>
              <p className="text-[10px] text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">How it Works</h2>
          </div>
          <div className="space-y-3">
            {[
              { icon: MapPin, title: 'Find Nearby', desc: 'GPS auto-detects your location' },
              { icon: Truck, title: 'Choose Delivery', desc: 'Pickup or home delivery' },
              { icon: Star, title: 'Pay Securely', desc: 'Paystack protected payments' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="w-12 h-12 bg-orange-500/15 rounded-xl flex items-center justify-center shrink-0">
                  <step.icon className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{step.title}</h3>
                  <p className="text-xs text-zinc-500">{step.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/20 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span className="text-xs font-bold text-orange-400">Earn ₦500 per referral</span>
          </div>
          <p className="text-sm text-zinc-300">Invite friends and earn when they buy gas</p>
          <Link href="/auth/register" className="inline-block text-sm font-bold text-orange-400">
            Get Started →
          </Link>
        </div>
      </section>

      <Fab />
      <SupportButton />\n      <BottomNav />
    </main>
  );
}
