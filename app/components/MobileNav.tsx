'use client';

import Link from 'next/link';
import { Home, ShoppingBag, ClipboardList, User } from 'lucide-react';

export function BottomNav({ active = 'home' }: { active?: string }) {
  const items = [
    { href: '/', icon: Home, label: 'Home', id: 'home' },
    { href: '/buy', icon: ShoppingBag, label: 'Buy', id: 'buy' },
    { href: '/orders', icon: ClipboardList, label: 'Orders', id: 'orders' },
    { href: '/profile', icon: User, label: 'Profile', id: 'profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <Link key={item.id} href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-all ${
                isActive ? 'bg-orange-500/15 text-orange-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
