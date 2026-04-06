'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, MapPin, User } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/buyer', label: 'Home', icon: Home },
    { href: '/buyer/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/tracking', label: 'Track', icon: MapPin },
    { href: '/buyer/account', label: 'Account', icon: User },
  ];

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 z-50 md:hidden'>
      <div className='flex items-center justify-around py-2'>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className='flex flex-col items-center gap-1 py-2 px-4'>
              <Icon className={active ? 'text-orange-400' : 'text-zinc-500'} style={{width: '20px', height: '20px'}} />
              <span className={active ? 'text-orange-400 text-xs' : 'text-zinc-500 text-xs'}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
