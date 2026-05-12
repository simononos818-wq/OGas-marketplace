'use client';

import { useState, useRef, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, ArrowRight, Flame } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { RecaptchaVerifier } from 'firebase/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const { loginWithPhone, verifyOTP, loginWithEmail } = useAuth();

  const handlePhoneSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : 
'+234' + phoneNumber.replace(/^0/, '');
      const { auth } = await import('../../../lib/firebase');
      if (recaptchaRef.current) {
        const recaptchaVerifier = new 
RecaptchaVerifier(recaptchaRef.current, { size: 'invisible' } as any, 
auth);
        const confirmation = await loginWithPhone(formattedPhone, 
recaptchaVerifier);
        setStep('otp');
      }
    } catch (error) {
      alert('Failed to send OTP');
    }
  };

  const handleOTPSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await verifyOTP('', otp);
      window.location.href = '/buyer/dashboard';
    } catch (error) {
      alert('Invalid OTP');
    }
  };

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      window.location.href = '/buyer/dashboard';
    } catch (error) {
      alert('Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 
via-slate-900 to-orange-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 
to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome 
Back</h1>
          <p className="text-slate-400">Login to your OGas account</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border 
border-slate-800 rounded-2xl p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMethod('phone')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium 
transition-all ${
                method === 'phone' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Phone className="w-4 h-4 inline mr-2" />
              Phone
            </button>
            <button
              onClick={() => setMethod('email')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium 
transition-all ${
                method === 'email' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </button>
          </div>

          {method === 'phone' ? (
            step === 'input' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium 
text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 
-translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-800 border 
border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none 
focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 
to-red-600 text-white font-semibold py-3 rounded-xl hover:from-orange-600 
hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                  Send OTP
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div ref={recaptchaRef}></div>
              </form>
            ) : (
              <form onSubmit={handleOTPSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium 
text-slate-300 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 
rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 
focus:ring-orange-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 
to-red-600 text-white font-semibold py-3 rounded-xl hover:from-orange-600 
hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                  Verify OTP
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 
mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 
-translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 
rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 
focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 
mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 
rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 
focus:ring-orange-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 
to-red-600 text-white font-semibold py-3 rounded-xl hover:from-orange-600 
hover:to-red-700 transition-all flex items-center justify-center gap-2"
              >
                Login
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          <p className="text-center text-slate-500 text-sm mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-orange-400 
hover:text-orange-300">
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
