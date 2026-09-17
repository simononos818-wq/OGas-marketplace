'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, query, getDocs, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/app/context/AuthContext';
import {
  CheckCircle, XCircle, Clock, Store, MapPin, Phone, Mail,
  Loader2, Shield, AlertTriangle, User, Search
} from 'lucide-react';

interface SellerDoc {
  id: string;
  businessName: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  landmark?: string;
  sellerType?: string;
  location?: { lat: number; lng: number };
  isApproved?: boolean;
  sellerStatus?: string;
  statusBadge?: string;
  verified?: boolean;
  isActive?: boolean;
  photos?: { front?: string; stock?: string };
  createdAt?: any;
  [key: string]: any;
}

interface UserDoc {
  uid: string;
  name?: string;
  email?: string;
  role?: string;
  sellerStatus?: string;
  sellerApplication?: {
    applicationId?: string;
    businessName?: string;
    submittedAt?: any;
  };
  rejectionReason?: string;
}

const ADMIN_EMAILS = ['simononos818@gmail.com'];
const ADMIN_UIDS: string[] = [];

export default function AdminSellersPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuthContext();
  const [sellers, setSellers] = useState<SellerDoc[]>([]);
  const [users, setUsers] = useState<Record<string, UserDoc>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const isAdmin = userData?.role === 'admin' || ADMIN_EMAILS.includes(user?.email || '') || ADMIN_UIDS.includes(user?.uid || '');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/');
      return;
    }
    loadSellers();
  }, [user, authLoading, isAdmin]);

  const loadSellers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'sellers')));
      const sellerList: SellerDoc[] = [];
      snap.forEach((d) => sellerList.push({ id: d.id, ...d.data() } as SellerDoc));

      // Sort: pending first, then approved, then rejected
      sellerList.sort((a, b) => {
        const statusOrder = { pending: 0, approved: 1, rejected: 2, unknown: 3 };
        const getStatus = (s: SellerDoc) => {
          if (s.sellerStatus === 'pending' || s.isApproved === false) return 'pending';
          if (s.sellerStatus === 'rejected') return 'rejected';
          if (s.sellerStatus === 'approved' || s.isApproved === true) return 'approved';
          return 'unknown';
        };
        return statusOrder[getStatus(a)] - statusOrder[getStatus(b)];
      });

      setSellers(sellerList);

      // Load matching user docs for application IDs
      const userMap: Record<string, UserDoc> = {};
      await Promise.all(
        sellerList.map(async (s) => {
          try {
            const uSnap = await getDocs(query(collection(db, 'users')));
            uSnap.forEach((d) => {
              const u = d.data() as UserDoc;
              u.uid = d.id;
              if (d.id === s.id) userMap[d.id] = u;
            });
          } catch (e) {}
        })
      );
      setUsers(userMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId: string) => {
    setActionLoading(sellerId);
    try {
      const now = new Date();

      // 1. Update sellers collection
      await updateDoc(doc(db, 'sellers', sellerId), {
        isApproved: true,
        sellerStatus: 'approved',
        statusBadge: 'Verified Seller',
        verified: true,
        isActive: true,
        approvedAt: now,
        approvedBy: user?.uid,
        updatedAt: serverTimestamp(),
      });

      // 2. Update users collection (THIS IS THE KEY SYNC)
      await updateDoc(doc(db, 'users', sellerId), {
        role: 'seller',
        sellerStatus: 'approved',
        approvedAt: now,
        approvedBy: user?.uid,
        rejectionReason: null,
      });

      setSellers((prev) =>
        prev.map((s) =>
          s.id === sellerId
            ? { ...s, isApproved: true, sellerStatus: 'approved', statusBadge: 'Verified Seller', verified: true, isActive: true }
            : s
        )
      );
    } catch (err) {
      console.error('Approve failed:', err);
      alert('Failed to approve. Check console.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (sellerId: string, reason: string = 'Application did not meet requirements') => {
    setActionLoading(sellerId);
    try {
      // 1. Update sellers collection
      await updateDoc(doc(db, 'sellers', sellerId), {
        isApproved: false,
        sellerStatus: 'rejected',
        statusBadge: 'Application Rejected',
        verified: false,
        isActive: false,
        rejectedAt: new Date(),
        rejectedBy: user?.uid,
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
      });

      // 2. Update users collection (SYNC)
      await updateDoc(doc(db, 'users', sellerId), {
        sellerStatus: 'rejected',
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectedBy: user?.uid,
      });

      setSellers((prev) =>
        prev.map((s) =>
          s.id === sellerId
            ? { ...s, isApproved: false, sellerStatus: 'rejected', statusBadge: 'Application Rejected', verified: false, isActive: false }
            : s
        )
      );
    } catch (err) {
      console.error('Reject failed:', err);
      alert('Failed to reject. Check console.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = sellers.filter((s) => {
    const status = s.sellerStatus || (s.isApproved ? 'approved' : 'pending');
    if (filter !== 'all' && status !== filter) return false;
    const q = search.toLowerCase();
    return (
      s.businessName?.toLowerCase().includes(q) ||
      s.ownerName?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q)
    );
  });

  const pendingCount = sellers.filter((s) => !s.isApproved && s.sellerStatus !== 'rejected').length;
  const approvedCount = sellers.filter((s) => s.isApproved || s.sellerStatus === 'approved').length;
  const rejectedCount = sellers.filter((s) => s.sellerStatus === 'rejected').length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-orange-500">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-6">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">You do not have admin privileges.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-orange-500 text-black font-bold px-6 py-2 rounded-xl"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="sticky top-0 bg-black border-b border-gray-800 p-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-orange-500" />
            <div>
              <h1 className="text-xl font-bold">OGas Admin</h1>
              <p className="text-xs text-gray-400">Seller Onboarding Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">{pendingCount} pending</span>
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full">{approvedCount} approved</span>
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full">{rejectedCount} rejected</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              placeholder="Search sellers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${
                  filter === f
                    ? 'bg-orange-500 text-black'
                    : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Store size={48} className="mx-auto mb-4 opacity-50" />
            <p>No sellers found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((seller) => {
              const userDoc = users[seller.id];
              const isPending = !seller.isApproved && seller.sellerStatus !== 'rejected';
              const isRejected = seller.sellerStatus === 'rejected';
              const isApproved = seller.isApproved || seller.sellerStatus === 'approved';

              return (
                <div
                  key={seller.id}
                  className={`bg-gray-900 border rounded-xl p-4 ${
                    isPending
                      ? 'border-amber-500/30'
                      : isRejected
                      ? 'border-red-500/30'
                      : 'border-green-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{seller.businessName || 'Unnamed'}</h3>
                        {isPending && (
                          <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Pending
                          </span>
                        )}
                        {isApproved && (
                          <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Rejected
                          </span>
                        )}
                      </div>

                      {userDoc?.sellerApplication?.applicationId && (
                        <p className="text-xs text-amber-500 font-mono mb-2">
                          App ID: {userDoc.sellerApplication.applicationId}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-400">
                        {seller.ownerName && (
                          <p className="flex items-center gap-1.5">
                            <User size={14} /> {seller.ownerName}
                          </p>
                        )}
                        {seller.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone size={14} /> {seller.phone}
                          </p>
                        )}
                        {seller.email && (
                          <p className="flex items-center gap-1.5">
                            <Mail size={14} /> {seller.email}
                          </p>
                        )}
                        {seller.sellerType && (
                          <p className="flex items-center gap-1.5">
                            <Store size={14} /> {seller.sellerType}
                          </p>
                        )}
                        {seller.address && (
                          <p className="flex items-center gap-1.5 sm:col-span-2">
                            <MapPin size={14} /> {seller.address}
                            {seller.landmark && ` (near ${seller.landmark})`}
                          </p>
                        )}
                        {seller.location && (
                          <p className="text-xs font-mono text-gray-500 sm:col-span-2">
                            GPS: {seller.location.lat?.toFixed(6)}, {seller.location.lng?.toFixed(6)}
                          </p>
                        )}
                      </div>

                      {/* Photos */}
                      {seller.photos && (
                        <div className="flex gap-2 mt-3">
                          {seller.photos.front && (
                            <a href={seller.photos.front} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline">
                              View Front Photo
                            </a>
                          )}
                          {seller.photos.stock && (
                            <a href={seller.photos.stock} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline">
                              View Stock Photo
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleApprove(seller.id)}
                            disabled={actionLoading === seller.id}
                            className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {actionLoading === seller.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason (optional):') || 'Application did not meet requirements';
                              handleReject(seller.id, reason);
                            }}
                            disabled={actionLoading === seller.id}
                            className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}

                      {isRejected && (
                        <button
                          onClick={() => handleApprove(seller.id)}
                          disabled={actionLoading === seller.id}
                          className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {actionLoading === seller.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          Re-approve
                        </button>
                      )}

                      {isApproved && (
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:') || 'Revoked by admin';
                            handleReject(seller.id, reason);
                          }}
                          disabled={actionLoading === seller.id}
                          className="bg-red-600/50 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle size={14} /> Revoke
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
