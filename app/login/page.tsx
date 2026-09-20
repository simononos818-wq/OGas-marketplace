'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import PhoneAuthForm from '@/components/PhoneAuthForm';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    isSeller: false,
  });

  const afterAuth = async (uid: string, fallbackSeller?: boolean) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    const sellerDoc = await getDoc(doc(db, 'sellers', uid));
    const role = userDoc.data()?.role;
    if (sellerDoc.exists() || role === 'seller' || fallbackSeller) {
      router.push(sellerDoc.exists() ? '/seller/dashboard' : '/seller/register');
    } else {
      router.push('/');
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(userCredential.user, { displayName: form.name });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.isSeller ? 'seller' : 'buyer',
          createdAt: new Date(),
          addresses: [],
        });
        await afterAuth(userCredential.user.uid, form.isSeller);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
        await afterAuth(userCredential.user.uid);
      }
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm font-bold focus:outline-none";
  const inputStyle = { background: '#f4f6f8', border: '1.5px solid #e6e9ee', color: NAVY };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f4f6f8' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/ogas-icon.svg" alt="OGas" className="h-16 w-16 rounded-full bg-white object-cover" style={{ boxShadow: '0 4px 12px rgba(20,30,50,.12)' }} />
          </div>
          <h1 className="text-3xl font-extrabold" style={{ color: NAVY }}>OGas</h1>
          <p className="mt-1 text-sm font-bold" style={{ color: '#8a8f98' }}>
            {mode === 'phone' ? 'Sign in with your phone' : isRegister ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <div className="flex rounded-xl p-1 mb-6 bg-white" style={{ boxShadow: '0 1px 3px rgba(20,30,50,.06)' }}>
          <button
            type="button"
            onClick={() => setMode('phone')}
            className="flex-1 py-2 rounded-lg text-sm font-bold"
            style={mode === 'phone' ? { background: NAVY, color: '#fff' } : { color: '#8a8f98' }}
          >
            Phone OTP
          </button>
          <button
            type="button"
            onClick={() => setMode('email')}
            className="flex-1 py-2 rounded-lg text-sm font-bold"
            style={mode === 'email' ? { background: NAVY, color: '#fff' } : { color: '#8a8f98' }}
          >
            Email
          </button>
        </div>

        {mode === 'phone' ? (
          <PhoneAuthForm
            asSeller={false}
            submitLabel="Send login code"
            onVerified={(uid) => afterAuth(uid)}
          />
        ) : (
          <>
            {error && (
              <div className="border rounded-xl p-3 mb-4 text-sm text-center font-bold" style={{ background: '#fdeceb', borderColor: '#f5b3ae', color: '#e74c3c' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleEmail} className="space-y-4">
              {isRegister && (
                <>
                  <input
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                    style={inputStyle}
                    required
                  />
                  <input
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputCls}
                    style={inputStyle}
                    required
                  />
                </>
              )}
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
                style={inputStyle}
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputCls + " pr-12"}
                  style={inputStyle}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#8a8f98' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isRegister && (
                <label className="flex items-center gap-2 text-sm font-bold" style={{ color: '#8a8f98' }}>
                  <input
                    type="checkbox"
                    checked={form.isSeller}
                    onChange={(e) => setForm({ ...form, isSeller: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: TEAL }}
                  />
                  I want to sell gas on OGas
                </label>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                style={{ background: TEAL }}
              >
                {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
              </button>
            </form>
            <p className="text-center mt-6 text-sm font-bold" style={{ color: '#8a8f98' }}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="font-bold"
                style={{ color: TEAL }}
              >
                {isRegister ? 'Login' : 'Register'}
              </button>
            </p>
          </>
        )}

        <p className="text-center mt-4 text-sm font-bold" style={{ color: '#8a8f98' }}>
          Selling gas? <Link href="/seller/login" style={{ color: TEAL }}>Seller desk</Link>
        </p>
        <p className="text-center mt-2 text-sm font-bold" style={{ color: '#8a8f98' }}>
          <Link href="/" style={{ color: TEAL }}>Continue as Guest</Link>
        </p>
      </div>
    </div>
  );
}
