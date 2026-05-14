'use client';

import { useState, Suspense } from 'react';
import { Flame, Loader2, Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Gift } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type UserType = 'buyer' | 'seller';

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<UserType>('buyer');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillRef = searchParams.get('ref') || '';

  const { registerWithEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerWithEmail(email, password, userType);
      const { auth } = await import('@/lib/firebase');
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Registration failed');

      const myCode = 'OG' + Math.random().toString(36).substring(2, 8).toUpperCase();

      await setDoc(doc(db, 'users', uid), {
        uid, name: fullName, email, phone, userType,
        referralCode: myCode, referrals: 0, referralEarnings: 0,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'referralCodes', myCode), {
        userId: uid, email, createdAt: serverTimestamp(),
      });

      const usedCode = referralCode || prefillRef;
      if (usedCode) {
        const refDoc = await getDoc(doc(db, 'referralCodes', usedCode));
        if (refDoc.exists()) {
          const referrerId = refDoc.data().userId;
          await setDoc(doc(db, 'users', referrerId, 'referrals', uid), {
            referredUserId: uid, referredName: fullName, referredEmail: email,
            status: 'pending', createdAt: serverTimestamp(),
          });
        }
      }

      router.push(userType === 'seller' ? '/seller-dashboard' : '/buy');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 mb-3 shadow-lg shadow-orange-500/25">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Join OGas</h1>
          <p className="text-zinc-400 text-xs">Buy or sell gas across Nigeria</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg mb-3 text-xs">
            {error}
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex gap-1 p-1 bg-zinc-800 rounded-lg">
            <button onClick={() => setUserType('buyer')}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition ${userType === 'buyer' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              I Buy Gas
            </button>
            <button onClick={() => setUserType('seller')}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition ${userType === 'seller' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              I Sell Gas
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  placeholder="John Doe" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  placeholder="you@email.com" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  placeholder="+234 801 234 5678" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-10 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  placeholder="Min 6 characters" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                <Gift className="w-3 h-3 text-orange-400" />
                Referral Code (optional)
              </label>
              <input type="text" value={referralCode || prefillRef} onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="Friend's code (e.g. OGABC123)" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account<<ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-zinc-500 text-xs">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function RegisterLoading() {
  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <Flame className="w-8 h-8 text-orange-500 animate-pulse mx-auto mb-2" />
        <p className="text-zinc-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function RegisterClient() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterForm />
    </Suspense>
  );
}
