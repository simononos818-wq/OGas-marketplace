'use client';

import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import { getDbInstance } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [isSeller, setIsSeller] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    const db = getDbInstance();
    getDoc(doc(db, 'sellers', user.uid)).then((snap) => {
      setIsSeller(snap.exists());
      setChecking(false);
    });
  }, [user]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-orange-500 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Please sign in</p>
          <a href="/login" className="bg-orange-500 text-black font-bold px-6 py-3 rounded-xl">Sign In</a>
        </div>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">You are not registered as a seller</p>
          <a href="/seller/register" className="bg-orange-500 text-black font-bold px-6 py-3 rounded-xl">Register</a>
        </div>
      </div>
    );
  }

  return <SellerDashboardContent userId={user.uid} />;
}

function SellerDashboardContent({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  useEffect(() => {
    const db = getDbInstance();
    // Simple stats fetch - you can expand this
    getDoc(doc(db, 'sellers', userId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStats({
          total: data.totalOrders || 0,
          pending: data.pendingOrders || 0,
          completed: data.completedOrders || 0,
        });
      }
    });
  }, [userId]);

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="px-4 pt-4">
        <h1 className="text-white text-2xl font-bold mb-4">Seller Dashboard</h1>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-orange-400 text-2xl font-bold">{stats.total}</p>
            <p className="text-gray-400 text-xs">Total Orders</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-yellow-400 text-2xl font-bold">{stats.pending}</p>
            <p className="text-gray-400 text-xs">Pending</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-green-400 text-2xl font-bold">{stats.completed}</p>
            <p className="text-gray-400 text-xs">Completed</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm">Full dashboard coming soon...</p>
      </div>
    </div>
  );
}
