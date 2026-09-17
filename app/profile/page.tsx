'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/app/context/AuthContext';
import {
  User, LogOut, Package, MapPin, Phone, Mail, ChevronRight,
  Store, Shield, Clock, XCircle, CheckCircle, Wrench, Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  items: any[];
  createdAt: any;
  sellerName: string;
}

function StatusBadge({ userData }: { userData: any }) {
  if (!userData) return null;

  const { role, sellerStatus, addresses } = userData;
  const hasAddresses = Array.isArray(addresses) && addresses.length > 0;

  let statusText = 'Unverified';
  let statusColor = 'text-gray-500';
  let bgColor = 'bg-gray-500';
  let Icon = Shield;

  if (sellerStatus === 'pending') {
    statusText = 'Pending Approval';
    statusColor = 'text-amber-500';
    bgColor = 'bg-amber-500';
    Icon = Clock;
  } else if (sellerStatus === 'rejected') {
    statusText = 'Application Rejected';
    statusColor = 'text-red-500';
    bgColor = 'bg-red-500';
    Icon = XCircle;
  } else if (role === 'seller' && sellerStatus === 'approved') {
    statusText = 'Verified Seller';
    statusColor = 'text-blue-500';
    bgColor = 'bg-blue-500';
    Icon = CheckCircle;
  } else if (hasAddresses) {
    statusText = 'Verified Customer';
    statusColor = 'text-green-500';
    bgColor = 'bg-green-500';
    Icon = CheckCircle;
  }

  return (
    <div className={`flex items-center gap-2 mt-1`}>
      <span className={`w-2 h-2 rounded-full ${bgColor}`} />
      <Icon size={12} className={statusColor} />
      <span className={`text-xs font-semibold ${statusColor}`}>{statusText}</span>
    </div>
  );
}

function SellerSection({ userData }: { userData: any }) {
  const router = useRouter();
  if (!userData) return null;

  const { role, sellerStatus, sellerApplication } = userData;

  if (role === 'seller' && sellerStatus === 'approved') {
    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Your Seller Account
        </h3>
        <Link
          href="/seller/dashboard"
          className="flex items-center justify-between bg-gray-900 border border-blue-500/30 rounded-xl px-4 py-4 hover:border-blue-500/60 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Store size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Seller Dashboard</p>
              <p className="text-xs text-gray-400">Manage orders, inventory & earnings</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </Link>
      </div>
    );
  }

  if (sellerStatus === 'pending') {
    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Sell Gas on OGas
        </h3>
        <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Clock size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Application Under Review</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Your seller application is being reviewed by the OGas team.
                You will be notified via SMS within 24-48 hours.
              </p>
              {sellerApplication?.applicationId && (
                <div className="mt-2 bg-black/40 rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">App ID:</span>
                  <span className="text-xs text-amber-500 font-mono font-semibold">
                    {sellerApplication.applicationId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sellerStatus === 'rejected') {
    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Sell Gas on OGas
        </h3>
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
              <XCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Application Rejected</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {userData.rejectionReason ||
                  'Your application did not meet our requirements. You may re-apply with corrected details.'}
              </p>
            </div>
          </div>
        </div>
        <Link
          href="/seller/register"
          className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-red-500/30 transition"
        >
          <div className="flex items-center gap-3 text-gray-300">
            <Store size={18} className="text-red-500" />
            <span className="text-sm font-medium">Re-apply as Seller</span>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Sell Gas on OGas
      </h3>

      <Link
        href="/buy-kit"
        className="flex items-center justify-between bg-gray-900 border border-orange-500/30 rounded-xl px-4 py-4 mb-3 hover:border-orange-500/60 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Wrench size={20} className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Start Selling — Buy a Kit</p>
            <p className="text-xs text-gray-400">New to gas? Get cylinder, scale & safety gear</p>
            <span className="inline-block mt-1 text-xs font-semibold text-orange-500">
              From ₦85,000 ›
            </span>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-600" />
      </Link>

      <Link
        href="/seller/register"
        className="flex items-center justify-between bg-gray-900 border border-blue-500/30 rounded-xl px-4 py-4 hover:border-blue-500/60 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Store size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Already Sell Gas? Join OGas</p>
            <p className="text-xs text-gray-400">Have a shop or plant? Register & get verified</p>
            <span className="inline-block mt-1 text-xs font-semibold text-blue-500">
              Register & Apply ›
            </span>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-600" />
      </Link>
    </div>
  );
}

function MenuItem({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-orange-500/30 transition"
    >
      <div className="flex items-center gap-3 text-gray-300">
        <span className="text-orange-500">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight size={16} className="text-gray-600" />
    </Link>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, userData, loading, logout } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadOrders();
    }
  }, [user, loading]);

  const loadOrders = async () => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('buyerId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order)));
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-orange-500">
        <Loader2 className="animate-spin mr-2" size={20} />
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-b from-orange-900/30 to-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <User size={32} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {userData?.name || user.displayName || 'User'}
              </h1>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <StatusBadge userData={userData} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <Package size={20} className="text-orange-500 mx-auto mb-1" />
            <p className="font-bold">{orders.length}</p>
            <p className="text-[10px] text-gray-500">Orders</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <MapPin size={20} className="text-blue-500 mx-auto mb-1" />
            <p className="font-bold">{userData?.addresses?.length || 0}</p>
            <p className="text-[10px] text-gray-500">Addresses</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <Phone size={20} className="text-green-500 mx-auto mb-1" />
            <p className="font-bold text-xs truncate">
              {userData?.phone || 'N/A'}
            </p>
            <p className="text-[10px] text-gray-500">Phone</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <MenuItem icon={<Package size={18} />} label="My Orders" href="/orders" />
          <MenuItem icon={<MapPin size={18} />} label="Saved Addresses" href="#" />
          <MenuItem icon={<Mail size={18} />} label="Support" href="mailto:support@ogaslpgmarketplace.com" />
        </div>

        <SellerSection userData={userData} />

        <div className="mb-6">
          <h2 className="font-bold mb-3">Recent Orders</h2>
          {ordersLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-gray-900 rounded-xl p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p>No orders yet</p>
              <Link href="/buy" className="text-orange-400 text-sm mt-2 inline-block">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {order.sellerName || 'Unknown Seller'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.items?.map((i: any) => i.size).join(', ')}
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${
                        order.status === 'completed'
                          ? 'bg-green-900/30 text-green-500'
                          : order.status === 'paid'
                          ? 'bg-blue-900/30 text-blue-500'
                          : 'bg-orange-900/30 text-orange-500'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      N{order.totalAmount?.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {order.createdAt?.toDate?.().toLocaleDateString() || 'Recent'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="w-full bg-red-900/20 border border-red-500/30 text-red-400 font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-900/30 transition"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}
