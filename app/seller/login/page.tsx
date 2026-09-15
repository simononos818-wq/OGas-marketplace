'use client';

import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';
import PhoneAuthForm from '@/components/PhoneAuthForm';

export default function SellerLoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">OGas Seller</h1>
        <p className="text-gray-400 mb-8">Verify the shop phone. That number is how we wake you for orders.</p>

        <PhoneAuthForm
          asSeller
          submitLabel="Send seller code"
          onVerified={async (uid) => {
            const snap = await getDoc(doc(db, 'sellers', uid));
            router.push(snap.exists() ? '/seller/dashboard' : '/seller/register');
          }}
        />

        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-500 text-sm">
            New seller? <Link href="/seller/register" className="text-orange-400">Register store</Link>
          </p>
          <p className="text-gray-500 text-sm">
            Buying gas? <Link href="/buy" className="text-orange-400">Go to Shop</Link>
          </p>
          <p className="text-gray-500 text-sm">
            Have an email account? <Link href="/login" className="text-orange-400">Email login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
