'use client';

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import app, { db } from '@/lib/firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export async function registerForNotifications(uid: string): Promise<void> {
  try {
    if (!VAPID_KEY) return;                 // key not set yet — skip silently
    if (!(await isSupported())) return;     // iOS Safari etc.
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'denied') return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;

    await setDoc(doc(db, 'userTokens', uid), {
      tokens: arrayUnion(token),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Notification registration skipped:', err);
  }
}
