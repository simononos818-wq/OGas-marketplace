'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import Link from 'next/link';

export default function SellerLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push('/seller/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">OGas Seller</h1>
        <p className="text-gray-400 mb-8">Login to your dashboard</p>

        {error && <div className="bg-red-900/30 border border-red-500 rounded-xl p-3 mb-4 text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" required />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" required />
          <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl hover:bg-orange-400 transition disabled:opacity-50">{loading ? 'Logging in...' : 'Login'}</button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-500 text-sm">New seller? <Link href="/seller/register" className="text-orange-400">Register</Link></p>
          <p className="text-gray-500 text-sm">Buying gas? <Link href="/buy" className="text-orange-400">Go to Shop</Link></p>
        </div>
      </div>
    </div>
  );
}
