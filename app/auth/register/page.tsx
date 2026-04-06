'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, User, ArrowRight, Flame, Loader2, Eye, EyeOff, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('verify');
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(userType === 'seller' ? '/seller-dashboard' : '/buyer');
    }, 1000);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(userType === 'seller' ? '/seller-dashboard' : '/buyer');
    }, 1000);
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

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 mb-4">
          <p className="text-sm text-zinc-400 mb-3 text-center">I want to:</p>
          <div className="flex p-1 bg-zinc-900 rounded-xl">
            <button
              onClick={() => setUserType('buyer')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                userType === 'buyer' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              Buy Gas
            </button>
            <button
              onClick={() => setUserType('seller')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                userType === 'seller' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              Sell Gas
            </button>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 space-y-5">
          <div className="flex p-1 bg-zinc-900 rounded-xl">
            <button
              onClick={() => setMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                method === 'phone' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
            <button
              onClick={() => setMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                method === 'email' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>
          </div>

          {method === 'phone' ? (
            step === 'input' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">+234</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="8012345678"
                      maxLength={10}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-14 pr-4 text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || phone.length < 10 || !name}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue<ArrowRight className="w-5 h-5" /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 px-4 text-center text-2xl tracking-widest text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                  <p className="mt-2 text-xs text-zinc-500 text-center">Code sent to +234{phone}</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Create Account'}
                </button>
                <button type="button" onClick={() => setStep('input')} className="w-full py-3 text-zinc-400 text-sm hover:text-white transition-colors">Change Number</button>
              </form>
            )
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !email || !password || !name}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-zinc-500 text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
