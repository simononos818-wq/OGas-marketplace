'use client';

import { useState, useRef, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, ArrowRight, Flame } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier } from 'firebase/auth';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [mode, setMode] = useState<'phone' | 'email' | 'otp'>('phone');
  const recaptchaRef = useRef<HTMLDivElement>(null);

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-orange-500 text-xl font-bold"
        >
          🔥 OGas Loading...
        </motion.div>
      </div>
    );
  }

  const { loginWithPhone, verifyOTP, loginWithEmail } = auth;

  const handlePhoneSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!recaptchaRef.current) return;
    
    const verifier = new RecaptchaVerifier(
      auth.auth, 
      recaptchaRef.current,
      { size: 'invisible' }
    );
    
    try {
      const confirmation = await loginWithPhone(phone, verifier);
      setVerificationId(confirmation.verificationId);
      setMode('otp');
    } catch (err) {
      alert('Phone login failed: ' + (err as Error).message);
    }
  };

  const handleOTPSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await verifyOTP(verificationId, otp);
      router.push('/buyer');
    } catch (err) {
      alert('OTP verification failed: ' + (err as Error).message);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      router.push('/buyer');
    } catch (err) {
      alert('Login failed: ' + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1a1a1a] rounded-2xl p-8 border border-orange-500/20"
      >
        <div className="text-center mb-8">
          <Flame className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">OGas</h1>
          <p className="text-gray-400 mt-2">Nigeria&apos;s LPG Marketplace</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('phone')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              mode === 'phone' ? 'bg-orange-500 text-white' : 'bg-[#2a2a2a] text-gray-400'
            }`}
          >
            <Phone className="w-4 h-4 inline mr-1" /> Phone
          </button>
          <button
            onClick={() => setMode('email')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              mode === 'email' ? 'bg-orange-500 text-white' : 'bg-[#2a2a2a] text-gray-400'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-1" /> Email
          </button>
        </div>

        {mode === 'phone' && (
          <form onSubmit={handlePhoneSubmit}>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white mb-4 focus:border-orange-500 focus:outline-none"
            />
            <div ref={recaptchaRef} />
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              Send OTP <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleOTPSubmit}>
            <p className="text-gray-400 text-sm mb-4">Enter OTP sent to {phone}</p>
            <input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white mb-4 focus:border-orange-500 focus:outline-none text-center text-2xl tracking-widest"
            />
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-lg transition"
            >
              Verify OTP
            </button>
          </form>
        )}

        {mode === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white mb-4 focus:border-orange-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white mb-4 focus:border-orange-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-lg transition"
            >
              Login
            </button>
          </form>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          New here? <a href="/auth/register" className="text-orange-500 hover:underline">Create account</a>
        </p>
      </motion.div>
    </div>
  );
}
