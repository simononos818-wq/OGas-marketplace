'use client';

import { useState } from 'react';
import { useAuthContext } from '@/app/context/AuthContext';
import { isNgPhone, normalizeNgPhone } from '@/lib/phone';

export default function PhoneAuthForm({
  asSeller = false,
  submitLabel = 'Send code',
  onVerified,
}: {
  asSeller?: boolean;
  submitLabel?: string;
  onVerified: (uid: string) => void;
}) {
  const { sendPhoneCode, confirmPhoneCode } = useAuthContext();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isNgPhone(phone)) {
      setError('Use a Nigerian number like 0803 123 4567');
      return;
    }
    setLoading(true);
    try {
      await sendPhoneCode(phone);
      setStep('code');
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Could not send SMS. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.trim().length < 4) {
      setError('Enter the 6-digit code from SMS');
      return;
    }
    setLoading(true);
    try {
      const user = await confirmPhoneCode(code, { name, asSeller });
      onVerified(user.uid);
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Wrong or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={step === 'phone' ? send : confirm} className="space-y-4">
      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
          <input
            type="tel"
            inputMode="tel"
            placeholder="0803 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            required
          />
          <p className="text-xs text-gray-500">
            We will text a one-time code to {phone ? normalizeNgPhone(phone) : 'your phone'}.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl hover:bg-orange-400 transition disabled:opacity-50"
          >
            {loading ? 'Sending code…' : submitLabel}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-400 text-center">
            Code sent to {normalizeNgPhone(phone)}
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-center tracking-[0.4em] text-xl placeholder-gray-500 focus:outline-none focus:border-orange-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl hover:bg-orange-400 transition disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify and continue'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setCode('');
              setError('');
            }}
            className="w-full text-sm text-gray-400"
          >
            Use a different number
          </button>
        </>
      )}
    </form>
  );
}
