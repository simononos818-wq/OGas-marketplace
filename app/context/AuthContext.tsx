'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  linkWithPhoneNumber,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { isNgPhone, normalizeNgPhone } from '@/lib/phone';

interface AuthContextType {
  user: User | null;
  userData: any;
  loading: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  sendPhoneCode: (phone: string) => Promise<void>;
  confirmPhoneCode: (code: string, extra?: { name?: string; asSeller?: boolean }) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isSeller: false,
  isAdmin: false,
  sendPhoneCode: async () => {},
  confirmPhoneCode: async () => {
    throw new Error('Auth not ready');
  },
  signOut: async () => {},
});

function getOrCreateVerifier(): RecaptchaVerifier {
  const w = window as any;
  if (w.__ogasRecaptcha) {
    return w.__ogasRecaptcha as RecaptchaVerifier;
  }
  let el = document.getElementById('recaptcha-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'recaptcha-container';
    document.body.appendChild(el);
  }
  const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
  w.__ogasRecaptcha = verifier;
  return verifier;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const phoneRef = useRef<string>('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docSnap = await getDoc(doc(db, 'users', u.uid));
        setUserData(docSnap.exists() ? docSnap.data() : null);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const sendPhoneCode = async (phone: string) => {
    if (!isNgPhone(phone)) {
      throw new Error('Enter a valid Nigerian phone number');
    }
    const formatted = normalizeNgPhone(phone);
    phoneRef.current = formatted;
    const verifier = getOrCreateVerifier();
    try {
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        try {
          confirmationRef.current = await linkWithPhoneNumber(auth.currentUser, formatted, verifier);
        } catch {
          confirmationRef.current = await signInWithPhoneNumber(auth, formatted, verifier);
        }
      } else {
        confirmationRef.current = await signInWithPhoneNumber(auth, formatted, verifier);
      }
    } catch (err) {
      try {
        (window as any).__ogasRecaptcha = null;
        verifier.clear();
      } catch {
        /* ignore */
      }
      throw err;
    }
  };

  const confirmPhoneCode = async (
    code: string,
    extra?: { name?: string; asSeller?: boolean },
  ): Promise<User> => {
    if (!confirmationRef.current) {
      throw new Error('Request a code first');
    }
    const cred = await confirmationRef.current.confirm(code.trim());
    const u = cred.user;
    const existing = await getDoc(doc(db, 'users', u.uid));
    const prevRole = existing.data()?.role;
    const role =
      prevRole === 'admin'
        ? 'admin'
        : prevRole === 'seller' || extra?.asSeller
          ? 'seller'
          : prevRole || 'buyer';
    await setDoc(
      doc(db, 'users', u.uid),
      {
        phone: phoneRef.current || u.phoneNumber || '',
        name: extra?.name || existing.data()?.name || u.displayName || '',
        role,
        updatedAt: serverTimestamp(),
        ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true },
    );
    const snap = await getDoc(doc(db, 'users', u.uid));
    setUserData(snap.exists() ? snap.data() : { role, phone: u.phoneNumber });
    setUser(u);
    confirmationRef.current = null;
    return u;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserData(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isSeller: userData?.role === 'seller',
        isAdmin: userData?.role === 'admin',
        sendPhoneCode,
        confirmPhoneCode,
        signOut,
      }}
    >
      {children}
      <div id="recaptcha-container" />
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
