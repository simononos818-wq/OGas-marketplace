'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Settings, Bell, Heart, ClipboardList, MapPin, ChevronRight, LogOut, Shield, HelpCircle, Award, TrendingUp, ShoppingBag, Home } from 'lucide-react';
import { BottomNav } from '../components/MobileNav';

function MenuItem({ icon: Icon, label, href, badge }: { icon: any; label: string; href: string; badge?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition">
      <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-zinc-400" />
      </div>
      <span className="flex-1 text-sm text-white">{label}</span>
      {badge && <span className="px-2 py-0.5 bg-orange-500/15 text-orange-400 text-xs font-medium rounded-full">{badge}</span>}
      <ChevronRight className="w-4 h-4 text-zinc-600" />
    </Link>
  );
}

export default function ProfilePage() {
  const [user] = useState({ name: 'Guest User', phone: '+234...', orders: 0, referrals: 0, earnings: 0 });

  return (
    <main className="min-h-screen w-full bg-zinc-950 pb-24">
      <div className="bg-gradient-to-b from-orange-500/20 to-zinc-950 pt-12 pb-6 px-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center border-4 border-zinc-900">
            <User className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            <p className="text-sm text-zinc-400">{user.phone}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full">Buyer</span>
              <span className="px-2 py-0.5 bg-orange-500/15 text-orange-400 text-xs rounded-full">New</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { value: user.orders, label: 'Orders', icon: ClipboardList },
            { value: user.referrals, label: 'Referrals', icon: Award },
            { value: `N${user.earnings}`, label: 'Earnings', icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
              <stat.icon className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2">
        <MenuItem icon={ClipboardList} label="My Orders" href="/orders" badge="0" />
        <MenuItem icon={Heart} label="Saved Sellers" href="/saved" />
        <MenuItem icon={MapPin} label="Delivery Addresses" href="/addresses" />
        <MenuItem icon={Award} label="Referral Program" href="/referral" badge="Earn N500" />
      </div>

      <div className="px-4 mt-4 space-y-2">
        <p className="text-xs text-zinc-600 font-medium px-1 uppercase tracking-wider">Settings</p>
        <MenuItem icon={Settings} label="Account Settings" href="/settings" />
        <MenuItem icon={Bell} label="Notifications" href="/notifications" />
        <MenuItem icon={Shield} label="Security" href="/security" />
        <MenuItem icon={HelpCircle} label="Help & Support" href="/support" />
      </div>

      <div className="px-4 mt-6">
        <button className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <BottomNav active="profile" />
    </main>
  );
}
