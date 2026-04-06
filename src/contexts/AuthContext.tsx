'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
  ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type UserRole = 'customer' | 'driver' | 'admin';

interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  role: UserRole;
  phoneVerified: boolean;
  photoURL?: string;
  createdAt: any;
  updatedAt: any;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, data: SignUpData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  verifyPhoneOTP: (otp: string, confirmationResult: ConfirmationResult) => Promise<boolean>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

interface SignUpData {
  displayName: string;
  phoneNumber: string;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          setUser({ ...userDoc.data(), uid: fbUser.uid } as User);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, data: SignUpData) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(newUser, { displayName: data.displayName });
    
    const userData: User = {
      uid: newUser.uid,
      email: newUser.email!,
      displayName: data.displayName,
      phoneNumber: data.phoneNumber,
      role: data.role,
      phoneVerified: false,
      photoURL: newUser.photoURL || undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', newUser.uid), userData);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const { user: googleUser } = await signInWithPopup(auth, provider);
    
    const userDoc = await getDoc(doc(db, 'users', googleUser.uid));
    
    if (!userDoc.exists()) {
      const userData: User = {
        uid: googleUser.uid,
        email: googleUser.email!,
        displayName: googleUser.displayName || 'User',
        phoneNumber: googleUser.phoneNumber || '',
        role: 'customer',
        phoneVerified: false,
        photoURL: googleUser.photoURL || undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'users', googleUser.uid), userData);
    }
  };

  const verifyPhoneOTP = async (otp: string, confirmationResult: ConfirmationResult) => {
    try {
      await confirmationResult.confirm(otp);
      
      if (firebaseUser) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          phoneVerified: true,
          updatedAt: serverTimestamp(),
        });
      }
      return true;
    } catch (error) {
      console.error('OTP verification failed:', error);
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!firebaseUser) return;
    
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      logout,
      verifyPhoneOTP,
      updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
