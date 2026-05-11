'use client';

import { useState } from 'react';
import { Flame, Loader2, Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/app/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterPage() {
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        phone,
        userType,
        createdAt: new Date().toISOString(),
        verified: false,
      });

      if (userType === 'seller') {
        await setDoc(doc(db, 'sellers', user.uid), {
          uid: user.uid,
          name,
          email,
          phone,
          verified: false,
          createdAt: new Date().toISOString(),
          rating: 0,
          totalOrders: 0,
          location: null,
          products: [],
        });
        router.push('/seller-dashboard');
      } else {
        router.push('/buyer');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 mb-3">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-zinc-400 text-sm">Join OGas today</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 mb-4">
          <p className="text-sm text-zinc-400 mb-3 text-center">I want to:</p>
          <div className="flex p-1 bg-zinc-900 rounded-xl">
            <button onClick={() => setUserType('buyer')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${userType === 'buyer' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'text-zinc-400 hover:text-white'}`}>
              <User className="w-4 h-4" /> Buy Gas
            </button>
            <button onClick={() => setUserType('seller')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${userType === 'seller' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'text-zinc-400 hover:text-white'}`}>
              <Store className="w-4 h-4" /> Sell Gas
            </button>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2348012345678" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-12 text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !name || !email || !password} className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account<ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-zinc-500 text-sm">
          Already have an account? <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
