'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogOut, Shield, User, Phone, Mail } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UIDCard } from '@/app/components/UIDCard';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff6b35]"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#111] border-b border-[#2a2a2a] p-6 pt-12">
        <h1 className="text-2xl font-bold text-center">My Profile</h1>
        <p className="text-[#666] text-center text-sm mt-1">Manage your account</p>
      </div>

      {/* UID Card */}
      <div className="mt-4">
        <UIDCard />
      </div>

      {/* Profile Info */}
      <div className="px-4 mt-6 space-y-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#ff6b35]/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-[#ff6b35]" />
            </div>
            <div>
              <p className="font-semibold">{user.displayName || 'User'}</p>
              <p className="text-[#666] text-sm">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-[#666]" />
              <span className="text-[#a0a0a0]">{user.phoneNumber || 'No phone'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-[#666]" />
              <span className="text-[#a0a0a0]">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-[#2ecc71]" />
              <span className="text-[#2ecc71]">Account Active</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="font-semibold mb-3">Order Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#ff6b35]">0</p>
              <p className="text-[#666] text-xs">Total Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#3498db]">0</p>
              <p className="text-[#666] text-xs">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#f44336]">0</p>
              <p className="text-[#666] text-xs">Disputes</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-[#f44336]/10 border border-[#f44336]/30 text-[#f44336] py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#f44336]/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
