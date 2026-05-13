'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  signInWithCredential, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User, 
  RecaptchaVerifier 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  loginWithPhone: (phone: string, verifier: RecaptchaVerifier) => Promise<any>;
  verifyOTP: (verificationId: string, otp: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  loginWithPhone: async () => { throw new Error('Auth not initialized'); },
  verifyOTP: async () => { throw new Error('Auth not initialized'); },
  loginWithEmail: async () => { throw new Error('Auth not initialized'); },
  registerWithEmail: async () => { throw new Error('Auth not initialized'); },
  logout: async () => { throw new Error('Auth not initialized'); },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) setUserRole(userDoc.data().role);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  const verifyOTP = async (verificationId: string, otp: string) => {
    const credential = PhoneAuthProvider.credential(verificationId, otp);
    await signInWithCredential(auth, credential);
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email: string, password: string, role: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', user.uid), { 
      email, 
      role, 
      createdAt: new Date().toISOString() 
    });
  };

  const logout = async () => await signOut(auth);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      loading, 
      loginWithPhone, 
      verifyOTP, 
      loginWithEmail, 
      registerWithEmail, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
