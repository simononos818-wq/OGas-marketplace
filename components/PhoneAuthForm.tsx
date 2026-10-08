'use client';

import { useState } from 'react';
import { useAuthContext } from '@/app/context/AuthContext';
import { isNgPhone, normalizeNgPhone } from '@/lib/phone';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

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
  // Which channel actually delivered the code — decides how we verify
  const [channel, setChannel] = useState<'termii' | 'firebase'>('termii');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isNgPhone(phone)) {
      setError('Use a Nigerian number like 0803 123 4567');
      return;
    }
    setLoading(true);
    try {
      // Preferred: Termii OTP (reliable for Nigerian numbers, works in the app)
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'login' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setChannel('termii');
        setStep('code');
        return;
      }
      // Termii unavailable (not configured / not approved yet) — fall back to Firebase SMS
      if (res.status === 429) {
        setError(data.error || 'Too many codes sent. Try again later.');
        return;
      }
      await sendPhoneCode(phone);
      setChannel('firebase');
      setStep('code');
    } catch (err: any) {
      // Last resort: Firebase phone auth
      try {
        await sendPhoneCode(phone);
        setChannel('firebase');
        setStep('code');
      } catch (err2: any) {
        setError(err2.message?.replace('Firebase: ', '') || 'Could not send SMS. Try again.');
      }
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
      let uid: string;
      if (channel === 'termii') {
        const res = await fetch('/api/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, pin: code.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok || !data.token) {
          throw new Error(data.error || 'Wrong or expired code');
        }
        const cred = await signInWithCustomToken(auth, data.token);
        uid = cred.user.uid;

        // Ensure the user profile exists (name, role, referral credit)
        const uref = doc(db, 'users', uid);
        const existing = await getDoc(uref);
        const prevRole = existing.data()?.role;
        const role = prevRole === 'admin' ? 'admin' : prevRole === 'seller' || asSeller ? 'seller' : prevRole || 'buyer';
        await setDoc(
          uref,
          {
            phone: normalizeNgPhone(phone),
            name: name || existing.data()?.name || '',
            role,
            updatedAt: serverTimestamp(),
            ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
            ...(existing.exists() ? {} : { referredBy: localStorage.getItem('ogas_ref') || null }),
          },
          { merge: true },
        );
      } else {
        const user = await confirmPhoneCode(code, { name, asSeller });
        uid = user.uid;
      }
      onVerified(uid);
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Wrong or expired code');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm font-bold focus:outline-none";
  const inputStyle = { background: '#f4f6f8', border: '1.5px solid #e6e9ee', color: NAVY };

  return (
    <form onSubmit={step === 'phone' ? send : confirm} className="space-y-4">
      {error && (
        <div className="border rounded-xl p-3 text-sm text-center font-bold" style={{ background: '#fdeceb', borderColor: '#f5b3ae', color: '#e74c3c' }}>
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
          <input
            type="tel"
            inputMode="tel"
            placeholder="0803 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
            style={inputStyle}
            required
          />
          <p className="text-xs" style={{ color: '#8a8f98' }}>
            We will text a one-time code to {phone ? normalizeNgPhone(phone) : 'your phone'}.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            style={{ background: TEAL }}
          >
            {loading ? 'Sending code…' : submitLabel}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-center font-bold" style={{ color: '#8a8f98' }}>
            Code sent to {normalizeNgPhone(phone)}
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={inputCls + " text-center tracking-[0.4em] text-xl"}
            style={inputStyle}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            style={{ background: TEAL }}
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
            className="w-full text-sm font-bold"
            style={{ color: '#8a8f98' }}
          >
            Use a different number
          </button>
        </>
      )}
    </form>
  );
}
