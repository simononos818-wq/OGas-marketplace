import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ogasapp-5a003',
};

if (!getApps().length) {
  initializeApp(firebaseAdminConfig);
}

export const adminDb = getFirestore();
