import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ogasapp-5a003';
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      return initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
    }
  }

  return initializeApp({ projectId });
}

const app = getAdminApp();
export const adminDb = getFirestore(app);
