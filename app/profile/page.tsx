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

const NAVY = '#16305e';
const TEAL = '#12a5b0';

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
  let color = '#8a8f98';
  let Icon = Shield;

  if (sellerStatus === 'pending') {
    statusText = 'Pending Approval';
    color = '#b35400';
    Icon = Clock;
  } else if (sellerStatus === 'rejected') {
    statusText = 'Application Rejected';
    color = '#e74c3c';
    Icon = XCircle;
  } else if (role === 'seller' && sellerStatus === 'approved') {
    statusText = 'Verified Seller';
    color = TEAL;
    Icon = CheckCircle;
  } else if (hasAddresses) {
    statusText = 'Verified Customer';
    color = '#0fa958';
    Icon = CheckCircle;
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <Icon size={12} style={{ color }} />
      <span className="text-xs font-bold" style={{ color }}>{statusText}</span>
    </div>
  );
}

function SellerSection({ userData }: { userData: any }) {
  if (!userData) return null;

  const { role, sellerStatus, sellerApplication } = userData;

  if (role === 'seller' && sellerStatus === 'approved') {
    return (
      <div className="mb-6">
        <h3 className="text-xs font-extrabold tracking-wider mb-3" style={{ color: '#8a8f98' }}>YOUR SELLER ACCOUNT</h3>
        <Link
          href="/seller/dashboard"
          className="flex items-center justify-between bg-white border rounded-xl px-4 py-4"
          style={{ borderColor: '#bfe6e9', boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e6f7f8' }}>
              <Store size={20} style={{ color: TEAL }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: NAVY }}>Seller Studio</p>
              <p className="text-xs" style={{ color: '#8a8f98' }}>Manage orders, inventory & earnings</p>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: '#c3cbd4' }} />
        </Link>
      </div>
    );
  }

  if (sellerStatus === 'pending') {
    return (
      <div className="mb-6">
        <h3 className="text-xs font-extrabold tracking-wider mb-3" style={{ color: '#8a8f98' }}>SELL GAS ON OGAS</h3>
        <div className="bg-white border rounded-xl p-4" style={{ borderColor: '#f0d48a', boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fff4e0' }}>
              <Clock size={20} style={{ color: '#b35400' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: NAVY }}>Application Under Review</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#8a8f98' }}>
                Your seller application is being reviewed by the OGas team.
                You will be notified via SMS within 24-48 hours.
              </p>
              {sellerApplication?.applicationId && (
                <div className="mt-2 rounded-lg px-3 py-1.5 inline-flex items-center gap-2" style={{ background: '#f4f6f8' }}>
                  <span className="text-[10px]" style={{ color: '#8a8f98' }}>App ID:</span>
                  <span className="text-xs font-mono font-bold" style={{ color: '#b35400' }}>
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
        <h3 className="text-xs font-extrabold tracking-wider mb-3" style={{ color: '#8a8f98' }}>SELL GAS ON OGAS</h3>
        <div className="bg-white border rounded-xl p-4 mb-3" style={{ borderColor: '#f5b3ae', boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fdeceb' }}>
              <XCircle size={20} style={{ color: '#e74c3c' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: NAVY }}>Application Rejected</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#8a8f98' }}>
                {userData.rejectionReason ||
                  'Your application did not meet our requirements. You may re-apply with corrected details.'}
              </p>
            </div>
          </div>
        </div>
        <Link
          href="/seller/register"
          className="flex items-center justify-between bg-white border rounded-xl px-4 py-3"
          style={{ borderColor: '#e6e9ee', boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}
        >
          <div className="flex items-center gap-3">
            <Store size={18} style={{ color: '#e74c3c' }} />
            <span className="text-sm font-bold" style={{ color: '#1a1d23' }}>Re-apply as Seller</span>
          </div>
          <ChevronRight size={16} style={{ color: '#c3cbd4' }} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-xs font-extrabold tracking-wider mb-3" style={{ color: '#8a8f98' }}>SELL GAS ON OGAS</h3>
      <Link
        href="/seller/register"
        className="flex items-center justify-between bg-white border rounded-xl px-4 py-4 mb-3"
        style={{ borderColor: '#bfe6e9', boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e6f7f8' }}>
            <Store size={20} style={{ color: TEAL }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: NAVY }}>Already Sell Gas? Join OGas</p>
            <p className="text-xs" style={{ color: '#8a8f98' }}>Have a shop or plant? Register & get verified</p>
            <span className="inline-block mt-1 text-xs font-bold" style={{ color: TEAL }}>Register & Apply ›</span>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: '#c3cbd4' }} />
      </Link>
    </div>
  );
}

function MenuItem({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between bg-white border rounded-xl px-4 py-3"
      style={{ borderColor: '#e6e9ee', boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: TEAL }}>{icon}</span>
        <span className="text-sm font-bold" style={{ color: '#1a1d23' }}>{label}</span>
      </div>
      <ChevronRight size={16} style={{ color: '#c3cbd4' }} />
    </Link>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, userData, loading, logout, signOut } = useAuthContext();
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
      <div className="min-h-screen flex items-center justify-center gap-2" style={{ background: '#f4f6f8', color: NAVY }}>
        <Loader2 className="animate-spin" size={20} />
        <span className="font-bold text-sm">Loading...</span>
      </div>
    );
  }

  if (!user) return null;

  const doLogout = async () => {
    try { await (logout?.() ?? signOut?.()); } catch {}
    router.push('/');
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-24" style={{ background: '#f4f6f8' }}>
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl p-5 mb-5 bg-white" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: NAVY }}>
              <User size={32} color="#fff" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold" style={{ color: NAVY }}>
                {userData?.name || user.displayName || 'User'}
              </h1>
              <p className="text-sm" style={{ color: '#8a8f98' }}>{user.email}</p>
              <StatusBadge userData={userData} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
            <Package size={20} style={{ color: TEAL }} className="mx-auto mb-1" />
            <p className="font-extrabold" style={{ color: NAVY }}>{orders.length}</p>
            <p className="text-[10px] font-bold" style={{ color: '#8a8f98' }}>Orders</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
            <MapPin size={20} style={{ color: NAVY }} className="mx-auto mb-1" />
            <p className="font-extrabold" style={{ color: NAVY }}>{userData?.addresses?.length || 0}</p>
            <p className="text-[10px] font-bold" style={{ color: '#8a8f98' }}>Addresses</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
            <Phone size={20} style={{ color: '#0fa958' }} className="mx-auto mb-1" />
            <p className="font-extrabold text-xs truncate" style={{ color: NAVY }}>
              {userData?.phone || 'N/A'}
            </p>
            <p className="text-[10px] font-bold" style={{ color: '#8a8f98' }}>Phone</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <MenuItem icon={<Package size={18} />} label="My Orders" href="/orders" />
          <MenuItem icon={<MapPin size={18} />} label="Saved Addresses" href="#" />
          <MenuItem icon={<Mail size={18} />} label="Support" href="mailto:support@ogaslpgmarketplace.com" />
        </div>

        <SellerSection userData={userData} />

        <div className="mb-6">
          <h2 className="font-extrabold mb-3" style={{ color: NAVY }}>Recent Orders</h2>
          {ordersLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border rounded-xl p-6 text-center" style={{ borderColor: '#e6e9ee' }}>
              <Package size={32} style={{ color: '#c3cbd4' }} className="mx-auto mb-2" />
              <p style={{ color: '#8a8f98' }}>No orders yet</p>
              <Link href="/" className="text-sm mt-2 inline-block font-bold" style={{ color: TEAL }}>
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 3).map((order) => {
                const done = order.status === 'completed' || order.status === 'delivered';
                const paid = order.status === 'paid';
                return (
                  <div
                    key={order.id}
                    className="bg-white border rounded-xl p-4 flex items-center justify-between"
                    style={{ borderColor: '#e6e9ee', boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}
                  >
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#1a1d23' }}>
                        {order.sellerName || 'Unknown Seller'}
                      </p>
                      <p className="text-xs" style={{ color: '#8a8f98' }}>
                        {order.items?.map((i: any) => i.size).join(', ')}
                      </p>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                        style={done
                          ? { background: '#e7f9ee', color: '#0fa958' }
                          : paid
                          ? { background: '#e8eefc', color: NAVY }
                          : { background: '#fff4e0', color: '#b35400' }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: NAVY }}>
                        ₦{order.totalAmount?.toLocaleString()}
                      </p>
                      <p className="text-[10px]" style={{ color: '#8a8f98' }}>
                        {order.createdAt?.toDate?.().toLocaleDateString() || 'Recent'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={doLogout}
          className="w-full border font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
          style={{ background: '#fdeceb', borderColor: '#f5b3ae', color: '#e74c3c' }}
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}
