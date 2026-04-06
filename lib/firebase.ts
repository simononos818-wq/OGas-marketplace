import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDWvX8sL_08ecR5sqtQbGTV8RR-NiNHzEc",
  authDomain: "ogasapp-5a003.firebaseapp.com",
  projectId: "ogasapp-5a003",
  storageBucket: "ogasapp-5a003.firebasestorage.app",
  messagingSenderId: "233768058710",
  appId: "1:233768058710:web:a0a378df2be9f453fce0f7",
  measurementId: "G-SXVSD31YF3"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => yes && (analytics = getAnalytics(app)));
}

export { app, auth, db, analytics };
