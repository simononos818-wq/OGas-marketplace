'use client';

import { useState } from 'react';
import { Flame, Loader2, Eye, EyeOff, Mail, Lock, User, ArrowRight, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
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
      await registerWithEmail(email, password, role);
      
      // Generate referral code for this user
      const myReferralCode = 'OG' + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Save user profile
      const userDoc = {
        name,
        email,
        phone,
        userType: role,
        referralCode: myReferralCode,
        referrals: 0,
        referralEarnings: 0,
        createdAt: new Date().toISOString(),
      };
      
      // If they used someone else's referral code
      if (referralCode || prefillRef) {
        const refCode = referralCode || prefillRef;
        const q = await getDoc(doc(db, 'referralCodes', refCode));
        if (q.exists()) {
          const referrerId = q.data().userId;
          await setDoc(doc(db, 'users', referrerId, 'referrals', myReferralCode), {
            referredUser: email,
            date: new Date().toISOString(),
            status: 'pending',
          });
        }
      }
      
      router.push(role === 'seller' ? '/seller-dashboard' : '/buy');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 mb-3">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Join OGas</h1>
          <p className="text-zinc-400 text-sm">Start buying or selling gas</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 space-y-5">
          {/* Role Toggle */}
          <div className="flex gap-2 p-1 bg-zinc-800 rounded-xl">
            <button
              onClick={() => setRole('buyer')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                role === 'buyer' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              I Want to Buy Gas
            </button>
            <button
              onClick={() => setRole('seller')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                role === 'seller' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              I Want to Sell Gas
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+234..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-12 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Referral Code (optional)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  value={referralCode || prefillRef} 
                  onChange={(e) => setReferralCode(e.target.value)} 
                  placeholder="Enter friend's code"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" 
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">Have a friend's code? Enter it to give them credit.</p>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account<ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-zinc-500 text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
