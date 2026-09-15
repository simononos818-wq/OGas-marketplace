'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { sendPhoneCode, confirmPhoneCode } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    if (!phone || phone.length < 10) return;
    setLoading(true);
    setError('');
    try {
      await sendPhoneCode(phone);
      setStep('code');
    } catch (e: any) {
      setError(e?.message || 'Could not send SMS. Check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');
    try {
      await confirmPhoneCode(code);
      router.push('/');
    } catch (e: any) {
      setError(e?.message || 'Wrong code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="text-2xl font-bold">Welcome to OGas</h1>
          <p className="text-gray-400 text-sm mt-2">Verify your phone to order or sell</p>
        </div>

        {error && <p className="text-red-400 text-xs mb-3 text-center">{error}</p>}

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
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">Enter SMS code</label>
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
              disabled={loading || code.length < 6}
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
          <Link href="/" className="text-orange-500 text-sm mt-2 inline-block">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
