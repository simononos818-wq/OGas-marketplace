import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Phone Auth helper for Nigeria (+234)
export const setupRecaptcha = (containerId: string) => {
  if (typeof window === 'undefined') return null;
  
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('Recaptcha verified');
    },
    'expired-callback': () => {
      console.log('Recaptcha expired');
    }
  });
};

export const sendOTPToNigeria = async (phoneNumber: string, appVerifier: any) => {
  try {
    // Format Nigerian number properly
    let formattedNumber = phoneNumber.replace(/\s/g, '');
    
    // Add +234 if not present
    if (!formattedNumber.startsWith('+')) {
      if (formattedNumber.startsWith('0')) {
        formattedNumber = '+234' + formattedNumber.substring(1);
      } else {
        formattedNumber = '+234' + formattedNumber;
      }
    }
    
    console.log('Sending OTP to:', formattedNumber);
    
    const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
    return { success: true, confirmationResult, formattedNumber };
  } catch (error: any) {
    console.error('OTP Error:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

export default app;
