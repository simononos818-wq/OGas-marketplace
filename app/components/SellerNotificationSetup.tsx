"use client";

import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';
import { getMessaging } from 'firebase/messaging';
import { Bell, BellOff, AlertTriangle } from 'lucide-react';

export default function SellerNotificationSetup({ sellerId }: { sellerId: string }) {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'default' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission as any);
    }
  }, []);

  const enable = async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        const messaging = getMessaging();
        const token = await getToken(messaging, {
          vapidKey: 'BHnWVKP-g1W9c1rErfYWI9sal_8jTQgGhH_92G2tZMgduD9PQBoC2zYO_voRza8O6PcH13Bj1JmKs4kwnCVJqPo'
        });
        
        if (token) {
          await setDoc(doc(db, 'sellers', sellerId), {
            fcmToken: token,
            notificationsEnabled: true,
            updatedAt: new Date(),
          }, { merge: true });
          
          // Also save to user doc for redundancy
          const sellerSnap = await getDoc(doc(db, 'sellers', sellerId));
          const sellerData = sellerSnap.data();
          if (sellerData?.userId) {
            await setDoc(doc(db, 'users', sellerData.userId), {
              fcmToken: token,
              updatedAt: new Date(),
            }, { merge: true });
          }
        }
      }
    } catch (e) {
      console.error('Notification setup failed', e);
    } finally {
      setLoading(false);
    }
  };

  if (permission === 'granted') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
        <Bell className="text-green-600" size={20} />
        <div>
          <p className="font-bold text-green-900 text-sm">🔔 Order Alerts Active</p>
          <p className="text-green-700 text-xs">You will receive instant vibration alerts for new orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
        <div className="flex-1">
          <p className="font-bold text-amber-900">⚠️ Enable Order Alerts</p>
          <p className="text-amber-800 text-sm mt-1">
            Missing orders = losing money to other sellers. Enable alerts to stay competitive.
          </p>
          <button
            onClick={enable}
            disabled={loading}
            className="mt-3 w-full py-3 rounded-lg font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: '#16305e' }}
          >
            {loading ? 'Activating...' : '🔔 Enable Instant Order Alerts'}
          </button>
          {permission === 'denied' && (
            <p className="text-red-600 text-xs mt-2">
              You blocked notifications. Go to Settings → Apps → OGas → Notifications → Allow.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
