'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { registerForNotifications } from '@/lib/notifications';

export default function NotificationManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) registerForNotifications(user.uid);
  }, [user?.uid]);

  return null;
}
