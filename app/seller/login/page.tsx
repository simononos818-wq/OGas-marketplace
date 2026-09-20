'use client';

import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';
import PhoneAuthForm from '@/components/PhoneAuthForm';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

export default function SellerLoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f4f6f8' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/ogas-icon.svg" alt="OGas" className="h-16 w-16 rounded-full bg-white object-cover" style={{ boxShadow: '0 4px 12px rgba(20,30,50,.12)' }} />
          </div>
          <h1 className="text-3xl font-extrabold" style={{ color: NAVY }}>OGas Seller</h1>
          <p className="mt-2 text-sm font-bold" style={{ color: '#8a8f98' }}>Verify the shop phone. That number is how we wake you for orders.</p>
        </div>

        <PhoneAuthForm
          asSeller
          submitLabel="Send seller code"
          onVerified={async (uid) => {
            const snap = await getDoc(doc(db, 'sellers', uid));
            router.push(snap.exists() ? '/seller/dashboard' : '/seller/register');
          }}
        />

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm font-bold" style={{ color: '#8a8f98' }}>
            New seller? <Link href="/seller/register" style={{ color: TEAL }}>Register store</Link>
          </p>
          <p className="text-sm font-bold" style={{ color: '#8a8f98' }}>
            Buying gas? <Link href="/" style={{ color: TEAL }}>Go to Shop</Link>
          </p>
          <p className="text-sm font-bold" style={{ color: '#8a8f98' }}>
            Have an email account? <Link href="/login" style={{ color: TEAL }}>Email login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
