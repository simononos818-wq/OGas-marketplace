'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 
'react';
import { onAuthStateChanged, signInWithPhoneNumber, PhoneAuthProvider, 
signInWithCredential, signInWithEmailAndPassword, 
createUserWithEmailAndPassword, signOut, User, RecaptchaVerifier } from 
'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// SAFE DEFAULT - never null, prevents SSR crash
const AuthContext = createContext({
  user: null as User | null,
  userRole: null as string | null,
  loading: true,
  loginWithPhone: async (_phone: string, _verifier: RecaptchaVerifier) => 
{ 
    throw new Error('Auth not initialized'); 
  },
  verifyOTP: async (_id: string, _otp: string) => { 
    throw new Error('Auth not initialized'); 
  },
  loginWithEmail: async (_email: string, _password: string) => { 
    throw new Error('Auth not initialized'); 
  },
  registerWithEmail: async (_email: string, _password: string, _role: 
string) => { 
    throw new Error('Auth not initialized'); 
  },
  logout: async () => { 
    throw new Error('Auth not initialized'); 
  },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) setUserRole(userDoc.data().role);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithPhone = async (phoneNumber: string, appVerifier: 
RecaptchaVerifier) => {
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  const verifyOTP = async (verificationId: string, otp: string) => {
    const credential = PhoneAuthProvider.credential(verificationId, otp);
    await signInWithCredential(auth, credential);
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email: string, password: string, role: 
string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, 
password);
    await setDoc(doc(db, 'users', user.uid), { email, role, createdAt: new 
Date().toISOString() });
  };

  const logout = async () => await signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userRole, loading, 
loginWithPhone, verifyOTP, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
