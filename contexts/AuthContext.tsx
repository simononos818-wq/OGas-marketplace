"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: FirebaseUser | null;
  userData: any;
  uid: string | null;
  loading: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  sellerStatus: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    phone: string,
    isSeller?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async (firebaseUser?: FirebaseUser | null) => {
    const targetUser = firebaseUser ?? user;
    if (!targetUser) {
      setUserData(null);
      return;
    }
    try {
      const docRef = doc(db, "users", targetUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        const basicData = {
          name: targetUser.displayName || "",
          email: targetUser.email || "",
          phone: targetUser.phoneNumber || "",
          role: "buyer",
          sellerStatus: null,
          addressesVerified: false,
          createdAt: new Date(),
          addresses: [],
        };
        await setDoc(docRef, basicData);
        setUserData(basicData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await refreshUserData(firebaseUser);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    isSeller: boolean = false
  ) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });

    const userDoc = {
      name,
      email,
      phone,
      role: isSeller ? "seller" : "buyer",
      sellerStatus: isSeller ? "pending" : null,
      addressesVerified: false,
      createdAt: new Date(),
      addresses: [],
    };

    await setDoc(doc(db, "users", result.user.uid), userDoc);
    setUserData(userDoc);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUserData(null);
  };

  const isSeller = userData?.role === "seller" && userData?.sellerStatus === "approved";
  const isAdmin = userData?.role === "admin";
  const sellerStatus = userData?.sellerStatus || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        uid: user?.uid || null,
        loading,
        isSeller,
        isAdmin,
        sellerStatus,
        signInWithEmail,
        signUp,
        logout,
        signOut: logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthContext() {
  return useAuth();
}
