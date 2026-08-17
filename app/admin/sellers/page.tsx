'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/app/context/AuthContext';
import { Loader2, CheckCircle, Clock, Store, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Seller {
  id: string;
  businessName?: string;
  ownerName?: string;
  ownerEmail?: string;
  phone?: string;
  address?: string;
  isApproved?: boolean;
  verified?: boolean;
  sellerStatus?: string;
  isActive?: boolean;
  pricePerKg?: number;
}

export default function AdminSellersPage() {
  const { user } = useAuthContext();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Your real admin emails
  const ADMIN_EMAILS = [
    'simon@ogaslpgmarketplace.com',
    'ogasventures@gmail.com',
  ];

  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'sellers'));
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Seller[];

        // Pending first
        data.sort((a, b) => {
          if (a.isApproved === b.isApproved) {
            return (a.businessName || '').localeCompare(b.businessName || '');
          }
          return a.isApproved ? 1 : -1;
        });

        setSellers(data);
      } catch (err) {
        console.error('Failed to load sellers:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, isAdmin]);

  const approveSeller = async (id: string) => {
    if (!confirm('Approve this seller? They will become live and can take real orders.')) return;

    setUpdating(id);
    try {
      await updateDoc(doc(db, 'sellers', id), {
        isApproved: true,
        verified: true,
        sellerStatus: 'approved',
        isActive: true,
        approvedAt: new Date().toISOString(),
      });

      setSellers((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, isApproved: true, verified: true, sellerStatus: 'approved', isActive: true }
            : s
        )
      );
    } catch (err) {
      console.error(err);
      alert('Failed to approve. Check console.');
    } finally {
      setUpdating(null);
    }
  };

  const revokeSeller = async (id: string) => {
    if (!confirm('Revoke approval? Seller will go back to Pending and cannot take orders.')) return;

    setUpdating(id);
    try {
      await updateDoc(doc(db, 'sellers', id), {
        isApproved: false,
        verified: false,
        sellerStatus: 'pending',
      });

      setSellers((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, isApproved: false, verified: false, sellerStatus: 'pending' }
            : s
        )
      );
    } catch (err) {
      console.error(err);
      alert('Failed to revoke.');
    } finally {
      setUpdating(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please log in first</p>
          <Link href="/login" className="text-orange-400 underline">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-2">Access Denied</p>
          <p className="text-gray-400 text-sm">You are not authorized to view this page.</p>
          <Link href="/" className="inline-block mt-4 text-orange-400">← Back to Home</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  const pendingCount = sellers.filter((s) => !s.isApproved).length;
  const approvedCount = sellers.filter((s) => s.isApproved).length;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-50 bg-black/95 border-b border-gray-800 px-4 py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Admin · Sellers</h1>
              <p className="text-xs text-gray-400">
                {pendingCount} pending · {approvedCount} approved
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-3 pb-20">
        {sellers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No sellers registered yet</p>
          </div>
        ) : (
          sellers.map((seller) => {
            const isPending = !seller.isApproved;
            return (
              <div
                key={seller.id}
                className={`bg-gray-900 rounded-2xl p-4 border ${
                  isPending ? 'border-yellow-600/40' : 'border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg truncate">
                        {seller.businessName || 'Unnamed Store'}
                      </h3>
                      {isPending ? (
                        <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-sm text-gray-400 space-y-0.5">
                      {seller.ownerName && <p>Owner: {seller.ownerName}</p>}
                      {seller.ownerEmail && <p>{seller.ownerEmail}</p>}
                      {seller.phone && <p>{seller.phone}</p>}
                      {seller.address && <p className="truncate">{seller.address}</p>}
                      {seller.pricePerKg && (
                        <p className="text-orange-400">₦{seller.pricePerKg}/kg</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {isPending ? (
                      <button
                        onClick={() => approveSeller(seller.id)}
                        disabled={updating === seller.id}
                        className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                      >
                        {updating === seller.id ? '...' : 'Approve'}
                      </button>
                    ) : (
                      <button
                        onClick={() => revokeSeller(seller.id)}
                        disabled={updating === seller.id}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                      >
                        {updating === seller.id ? '...' : 'Revoke'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
