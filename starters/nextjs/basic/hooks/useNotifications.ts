import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const app = getApps().length ? getApps()[0] : initializeApp(cfg);

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    const requestPermission = async () => {
      if (!('Notification' in window)) return;
      const result = await Notification.requestPermission();
      if (result === 'granted') await registerFCM();
    };

    const registerFCM = async () => {
      try {
        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
          vapidKey: 'BHnWVKP-g1W9c1rErfYWI9sal_8jTQgGhH_92G2tZMgduD9PQBoC2zYO_voRza8O6PcH13Bj1JmKs4kwnCVJqPo',
        });
        if (token) {
          setFcmToken(token);
          const user = getAuth().currentUser;
          if (user) {
            const functions = getFunctions(app);
            const register = httpsCallable(functions, 'registerFcmToken');
            await register({ token });
            console.log('FCM token registered');
          }
        }
      } catch (err) {
        console.log('FCM error:', err);
      }
    };

    const messaging = getMessaging(app);
    const unsub = onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload);
      
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 500]);
      }
      
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 1.0;
      audio.play().catch(() => {});
      
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'OGas', {
          body: payload.notification?.body,
          icon: 'https://ogasapp-5a003.web.app/icon-192.png',
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 500],
        });
      }
    });

    const user = getAuth().currentUser;
    let unsubFirestore: any = null;
    if (user) {
      const db = getFirestore();
      unsubFirestore = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        const data = doc.data();
        setUnreadCount(data?.unreadNotifications || 0);
        if (data?.lastOrderAt) {
          const lastTime = data.lastOrderAt.toDate();
          const now = new Date();
          if ((now.getTime() - lastTime.getTime()) / 1000 < 30) {
            setLastOrder(data.lastOrder);
            if (navigator.vibrate) {
              navigator.vibrate([100, 50, 100, 50, 200, 100, 300, 100, 500, 200, 1000]);
            }
          }
        }
      });
    }

    requestPermission();
    return () => { unsub(); if (unsubFirestore) unsubFirestore(); };
  }, []);

  const clearUnread = async () => {
    const user = getAuth().currentUser;
    if (!user) return;
    const db = getFirestore();
    await updateDoc(doc(db, 'users', user.uid), { unreadNotifications: 0 });
  };

  return { unreadCount, lastOrder, fcmToken, clearUnread };
}
