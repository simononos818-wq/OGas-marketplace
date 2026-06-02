'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);

  const sendCode = () => {
    if (!phone || phone.length < 10) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('code');
    }, 1000);
  };

  const verifyCode = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = '/';
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="text-2xl font-bold">Welcome to OGas</h1>
          <p className="text-gray-400 text-sm mt-2">Order gas, delivered fast</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">Phone Number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="08012345678"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-white text-lg focus:border-orange-500 outline-none transition"
              />
            </div>
            <button
              onClick={sendCode}
              disabled={loading || phone.length < 10}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition">
              {loading ? 'Sending...' : 'Continue'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">Enter Code</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-white text-lg text-center tracking-widest focus:border-orange-500 outline-none transition"
              />
              <p className="text-gray-500 text-xs mt-2 text-center">Code sent to {phone}</p>
            </div>
            <button
              onClick={verifyCode}
              disabled={loading || code.length < 4}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              onClick={() => setStep('phone')}
              className="w-full text-gray-400 text-sm py-2">
              ← Change number
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">No account needed</p>
          <Link href="/" className="text-orange-500 text-sm mt-2 inline-block">
            Skip for now →
          </Link>
        </div>
      </div>
    </div>
  );
}
