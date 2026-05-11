import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth } from '../config/firebase';
import { signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserData {
  uid: string;
  email: string;
  fullName?: string;
  phone?: string;
  role?: 'buyer' | 'seller';
}

interface AuthContextType {
  user: any;
  userData: UserData | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, role: string, extra: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) setUserData(snap.data() as UserData);
        } catch (e) {}
      } else {
        setUserData(null);
      }
      setLoading(false);
      setInitialized(true);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, role: string, extra: any) => {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const data: UserData = { uid: cred.user.uid, email, role: role as any, ...extra };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    setUserData(data);
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, initialized, signIn, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
