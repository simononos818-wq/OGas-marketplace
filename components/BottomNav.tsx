'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, User, ClipboardList, MessageSquare } from 'lucide-react';
import { useChatList } from '@/hooks/useChat';

export default function BottomNav() {
  const pathname = usePathname();
  const { totalUnread } = useChatList();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/buy', icon: ShoppingBag, label: 'Buy' },
    { href: '/orders', icon: ClipboardList, label: 'Orders' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  if (
    pathname?.startsWith('/seller/dashboard') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/seller/register') ||
    pathname?.startsWith('/seller/login') ||
    (pathname?.startsWith('/chat/') && pathname !== '/chat')
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-50">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                isActive ? 'text-orange-500' : 'text-gray-500'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.href === '/chat' && totalUnread > 0 && (
                <span className="absolute top-0 right-1 min-w-4 h-4 px-1 rounded-full bg-orange-500 text-black text-[10px] font-bold leading-4 text-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
