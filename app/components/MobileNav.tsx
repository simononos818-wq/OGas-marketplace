'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User } from 'lucide-react';

const navItems = [
  { id: 'home', href: '/', icon: Home, label: 'Home' },
  { id: 'buy', href: '/buy', icon: Search, label: 'Buy Gas' },
  { id: 'orders', href: '/buyer', icon: ShoppingBag, label: 'Orders' },
  { id: 'profile', href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link key={item.id} href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-orange-500/15 text-orange-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
