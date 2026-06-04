import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDWvX8sL_08ecR5sqtQbGTV8RR-NiNHzEc",
  authDomain: "ogasapp-5a003.firebaseapp.com",
  projectId: "ogasapp-5a003",
  storageBucket: "ogasapp-5a003.firebasestorage.app",
  messagingSenderId: "233768058710",
  appId: "1:233768058710:web:e13e9e5ce74a35e3fce0f7",
  measurementId: "G-41V7E9CE71"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Analytics only in browser
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) analytics = getAnalytics(app);
  }).catch(() => {});
}

export { app, db, auth, analytics };
