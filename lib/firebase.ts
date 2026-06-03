import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDWvX8sL_08ecR5sqtQbGTV8RR-NiNHzEc",
  authDomain: "ogasapp-5a003.firebaseapp.com",
  projectId: "ogasapp-5a003",
  storageBucket: "ogasapp-5a003.firebasestorage.app",
  messagingSenderId: "233768058710",
  appId: "1:233768058710:web:a0a378df2be9f453fce0f7",
  measurementId: "G-SXVSD31YF3"
};

// Use getApps() to prevent duplicate initialization during static generation
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics only on client
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => { if (yes) analytics = getAnalytics(app); }).catch(() => {});
}
export { analytics };

// Auth providers
export const googleProvider = new GoogleAuthProvider();

// Phone auth helper
export const setupRecaptcha = (containerId: string) => {
  if (typeof window === 'undefined') return null;
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
  });
};

export default app;
export { app };
