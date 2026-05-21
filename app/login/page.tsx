'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/buy/';
  const [isSignUp, setIsSignUp] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem('ogas_user', JSON.stringify({ phone, name, timestamp: Date.now() }));
    window.location.href = redirect;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">O</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{isSignUp ? 'Join OGas' : 'Welcome Back'}</h1>
          <p className="text-gray-400 mt-2">{isSignUp ? 'Create your account' : 'Sign in to order gas'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <input type="text" required placeholder="Simon Onos"
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
            <input type="tel" required placeholder="08012345678"
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-orange-400 font-semibold">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          <a href="/buy/" className="text-sm text-gray-500 hover:text-gray-300">
            Continue without account →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
