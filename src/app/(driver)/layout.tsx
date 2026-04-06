'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/RouteGuard';
import { Home, Package, DollarSign, User, LogOut, Truck, MapPin, Bell } from 'lucide-react';

const navItems = [
  { href: '/driver/dashboard', label: 'Dashboard', icon: Home },
  { href: '/driver/orders', label: 'Orders', icon: Package },
  { href: '/driver/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/driver/profile', label: 'Profile', icon: User },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  return (
    <RouteGuard allowedRoles={['driver']}>
      <div className="min-h-screen bg-slate-900 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 hidden md:flex flex-col fixed h-full border-r border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <Link href="/driver/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">OGas</span>
                <span className="text-xs text-green-400 block">Driver App</span>
              </div>
            </Link>
          </div>

          <div className="p-4 border-b border-slate-700">
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Status</span>
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </span>
              </div>
              <button className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors">
                Go Offline
              </button>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-800 text-white z-50 border-b border-slate-700">
          <div className="flex items-center justify-between p-4">
            <Link href="/driver/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">OGas Driver</span>
            </Link>
            <button onClick={logout} className="p-2 text-red-400">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex overflow-x-auto border-t border-slate-700 bg-slate-700">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-4 py-2 min-w-[80px] ${isActive ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-400'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pt-28 md:pt-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </RouteGuard>
  );
}
