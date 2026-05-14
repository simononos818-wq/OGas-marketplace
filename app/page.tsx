'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Flame, MapPin, ShoppingBag, Calculator, Package, Users, Star, Plus, Search, ChevronRight, Clock, Shield, Zap } from 'lucide-react';
import { BottomNav } from './components/MobileNav';

function Fab() {
  return (
    <Link href="/buy"
      className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 hover:scale-110 transition-transform">
      <Plus className="w-6 h-6 text-white" />
    </Link>
  );
}

function TopHeader() {
  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">O<span className="text-orange-400">Gas</span></span>
        </div>
      </div>
    </header>
  );
}

function SearchBar() {
  return (
    <div className="px-4 py-3">
      <Link href="/buy" className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-500 hover:border-zinc-700 transition">
        <Search className="w-5 h-5" />
        <span className="text-sm">Search gas sellers near you...</span>
        <MapPin className="w-4 h-4 ml-auto text-orange-400" />
      </Link>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-500/15 text-orange-400',
    blue: 'bg-blue-500/15 text-blue-400',
    green: 'bg-green-500/15 text-green-400',
    purple: 'bg-purple-500/15 text-purple-400',
  };
  return (
    <Link href={href} className="flex flex-col items-center gap-2 p-3">
      <div className={`w-12 h-12 ${colors[color] || colors.orange} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs text-zinc-400 font-medium">{label}</span>
    </Link>
  );
}

function SellerRow({ name, distance, price, rating, hasDelivery }: { name: string; distance: string; price: string; rating: number; hasDelivery: boolean }) {
  return (
    <Link href="/buy" className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition">
      <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
        <Flame className="w-6 h-6 text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-medium text-sm text-white truncate">{name}</h3>
          {hasDelivery && <span className="px-1.5 py-0.5 bg-green-500/15 text-green-400 text-[10px] font-medium rounded">Delivery</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {distance}</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {rating}</span>
        </div>
      </div>
      <div className="text-right">
        <span className="text-orange-400 font-bold text-sm">{price}</span>
        <p className="text-[10px] text-zinc-500">per kg</p>
      </div>
    </Link>
  );
}

export default function Home() {
  const [location, setLocation] = useState('Detecting...');

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setLocation('Oteri, Ughelli'),
        () => setLocation('Nigeria'),
        { timeout: 5000 }
      );
    } else {
      setLocation('Nigeria');
    }
  }, []);

  return (
    <main className="min-h-screen w-full bg-zinc-950 pb-24">
      <TopHeader />
      
      <div className="px-4 py-2 flex items-center gap-2 text-zinc-400 text-xs border-b border-zinc-800/30">
        <MapPin className="w-3 h-3 text-orange-400" />
        <span>{location}</span>
        <span className="text-zinc-600">-</span>
        <span className="text-zinc-500">Tap to change</span>
      </div>

      <SearchBar />

      <div className="px-4 py-2">
        <div className="grid grid-cols-4 gap-2">
          <QuickAction href="/buy" icon={ShoppingBag} label="Buy Gas" color="orange" />
          <QuickAction href="/calculator" icon={Calculator} label="Calculator" color="blue" />
          <QuickAction href="/business" icon={Users} label="Business" color="green" />
          <QuickAction href="/orders" icon={Package} label="Orders" color="purple" />
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="p-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/30 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">Earn 500 Per Referral</h3>
              <p className="text-xs text-zinc-400">Invite friends, earn cash when they buy gas</p>
            </div>
            <ChevronRight className="w-5 h-5 text-orange-400" />
          </div>
        </div>
      </div>

      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base text-white">Nearby Sellers</h2>
          <Link href="/buy" className="text-xs text-orange-400 font-medium flex items-center gap-1">
            See All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          <SellerRow name="Oteri Gas Depot" distance="0.5km" price="1,200" rating={4.8} hasDelivery={true} />
          <SellerRow name="Ughelli Gas Hub" distance="2.1km" price="1,150" rating={4.5} hasDelivery={true} />
          <SellerRow name="Delta Gas Mart" distance="3.5km" price="1,100" rating={4.2} hasDelivery={false} />
          <SellerRow name="Warri Gas Station" distance="5.2km" price="1,050" rating={4.0} hasDelivery={true} />
        </div>
      </section>

      <section className="px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          {[ 
            { icon: Shield, label: 'Verified Sellers', desc: 'All sellers checked' },
            { icon: Clock, label: 'Fast Delivery', desc: 'Avg 30 minutes' },
            { icon: Zap, label: 'Instant Pay', desc: 'Paystack secure' },
            { icon: Star, label: 'Top Rated', desc: '4.5+ average' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
              <item.icon className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-white">{item.label}</p>
                <p className="text-[10px] text-zinc-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-4">
        <div className="p-4 bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-white">Sell Gas on OGas</h3>
              <p className="text-xs text-zinc-400">Reach thousands of buyers in your area</p>
            </div>
            <Link href="/auth/register" className="px-4 py-2 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-500 transition">
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      <Fab />
      <BottomNav active="home" />
    </main>
  );
}
