'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth'; // ← change if your auth hook 
has a different name

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
}

export function useOrderChat(orderId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'chats', orderId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ChatMessage[];
        setMessages(msgs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError('Unable to load chat. Please refresh.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [orderId, user]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !user || !orderId || sending) return;

      setSending(true);
      setError(null);
      try {
        await addDoc(collection(db, 'chats', orderId, 'messages'), {
          text: text.trim(),
          senderId: user.uid,
          senderName: user.displayName || user.email?.split('@')[0] || 
'User',
          createdAt: serverTimestamp(),
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to send message');
      } finally {
        setSending(false);
      }
    },
    [user, orderId, sending]
  );

  return { messages, loading, sending, error, sendMessage };
}
