'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
  onAuthStateChanged,
  signOut,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { normalizeNgPhone } from '@/lib/fields';

interface AuthContextType {
  user: User | null;
  uid: string | null;
  loading: boolean;
  sendPhoneCode: (phoneNumber: string) => Promise<void>;
  confirmPhoneCode: (code: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  uid: null,
  loading: true,
  sendPhoneCode: async () => {},
  confirmPhoneCode: async () => {
    throw new Error('Auth not ready');
  },
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const ensureRecaptcha = () => {
    if (typeof window === 'undefined') return null;
    if (!document.getElementById('recaptcha-container')) {
      const el = document.createElement('div');
      el.id = 'recaptcha-container';
      document.body.appendChild(el);
    }
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear();
      } catch {
        /* ignore */
      }
      recaptchaRef.current = null;
    }
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
    return recaptchaRef.current;
  };

  const sendPhoneCode = async (phoneNumber: string) => {
    const formatted = normalizeNgPhone(phoneNumber);
    const verifier = ensureRecaptcha();
    if (!verifier) throw new Error('reCAPTCHA failed to start');
    confirmationRef.current = await signInWithPhoneNumber(auth, formatted, verifier);
  };

  const confirmPhoneCode = async (code: string) => {
    if (!confirmationRef.current) throw new Error('Send a code first');
    const result = await confirmationRef.current.confirm(code.trim());
    return result.user;
  };

  const logout = async () => {
    confirmationRef.current = null;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        uid: user?.uid || null,
        loading,
        sendPhoneCode,
        confirmPhoneCode,
        logout,
      }}
    >
      {children}
      <div id="recaptcha-container" />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
