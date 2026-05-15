'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Settings, Bell, Shield, HelpCircle, ChevronRight, LogOut, MapPin } from 'lucide-react';
import BottomNav from '@/app/components/MobileNav';

function MenuItem({ icon: Icon, label, onClick, danger = false }: { 
  icon: any; label: string; onClick?: () => void; danger?: boolean 
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 active:scale-[0.98] transition-transform">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-red-500/15' : 'bg-zinc-800'}`}>
        <Icon className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-zinc-400'}`} />
      </div>
      <span className={`flex-1 text-left font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</span>
      <ChevronRight className="w-5 h-5 text-zinc-600" />
    </button>
  );
}

export default function ProfileClient() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <main className="min-h-screen bg-zinc-950 pb-24">
      <header className="fixed top-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800 z-40 pt-safe">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center">
          <h1 className="font-bold text-lg">Profile</h1>
        </div>
      </header>

      <div className="pt-20 px-4 space-y-6">
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">{user?.displayName || 'Guest User'}</h2>
          <p className="text-white/70 text-sm">{user?.email || 'Sign in to continue'}</p>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="font-bold text-lg">0</p>
              <p className="text-[10px] text-white/70">Orders</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="font-bold text-lg">₦0</p>
              <p className="text-[10px] text-white/70">Spent</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="font-bold text-lg">0</p>
              <p className="text-[10px] text-white/70">Referrals</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-zinc-500 font-medium px-1">ACCOUNT</p>
          <MenuItem icon={Settings} label="Settings" />
          <MenuItem icon={Bell} label="Notifications" />
          <MenuItem icon={MapPin} label="Saved Addresses" />
        </div>

        <div className="space-y-3">
          <p className="text-xs text-zinc-500 font-medium px-1">SUPPORT</p>
          <MenuItem icon={HelpCircle} label="Help Center" />
          <MenuItem icon={Shield} label="Privacy & Security" />
        </div>

        {user && (
          <div className="pt-4">
            <MenuItem icon={LogOut} label="Sign Out" onClick={handleLogout} danger />
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
