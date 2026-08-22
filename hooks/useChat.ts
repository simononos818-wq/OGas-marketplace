'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../app/hooks/useAuth';
import { authHeaders } from '../lib/client-auth';
import type { ChatRole } from '../lib/chat';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole?: 'buyer' | 'seller' | 'system';
  type: 'text' | 'image' | 'system' | 'location';
  timestamp: Timestamp | null;
  readBy: string[];
}

export interface Chat {
  id: string;
  participants: string[];
  orderId: string;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  productLabel?: string;
  lastMessage: string;
  lastMessageAt?: Timestamp;
  lastSenderRole?: string;
  unreadCount: Record<string, number>;
  updatedAt?: Timestamp;
}

async function chatAction(payload: Record<string, unknown>) {
  const headers = await authHeaders();
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Chat failed');
  return data;
}

export function useChat(chatId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInfo, setChatInfo] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const openedRef = useRef(false);

  useEffect(() => {
    if (!chatId || !user) return;
    openedRef.current = false;
    const unsub = onSnapshot(doc(db, 'chats', chatId), (snapshot) => {
      if (snapshot.exists()) {
        setChatInfo({ id: snapshot.id, ...snapshot.data() } as Chat);
        setLoading(false);
      } else if (!openedRef.current) {
        openedRef.current = true;
        chatAction({ action: 'open', orderId: chatId })
          .catch((e) => setError(e.message))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [chatId, user]);

  useEffect(() => {
    if (!chatId || !user) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(200),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
    return () => unsub();
  }, [chatId, user]);

  useEffect(() => {
    if (!chatId || !user || !chatInfo) return;
    chatAction({ action: 'read', chatId }).catch(() => {});
  }, [chatId, user, chatInfo?.id, messages.length]);

  const sendMessage = useCallback(
    async (text: string, quickKey?: string) => {
      if (!chatId || !user) return;
      setSending(true);
      setError(null);
      try {
        await chatAction({ action: 'send', chatId, text, quickKey });
      } catch (e: any) {
        setError(e.message || 'Could not send');
        throw e;
      } finally {
        setSending(false);
      }
    },
    [chatId, user],
  );

  const role: ChatRole = chatInfo?.sellerId === user?.uid ? 'seller' : 'buyer';
  const counterpart =
    role === 'seller' ? chatInfo?.buyerName || 'Buyer' : chatInfo?.sellerName || 'Store';

  return {
    messages,
    chatInfo,
    loading,
    sending,
    error,
    role,
    counterpart,
    sendMessage,
    messagesEndRef,
  };
}

export function useChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);
  const buyerRows = useRef<Chat[]>([]);
  const sellerRows = useRef<Chat[]>([]);

  const merge = useCallback((uid: string) => {
    const map = new Map<string, Chat>();
    for (const row of [...buyerRows.current, ...sellerRows.current]) map.set(row.id, row);
    const list = Array.from(map.values()).sort((a, b) => {
      const am = a.updatedAt?.toMillis?.() || a.lastMessageAt?.toMillis?.() || 0;
      const bm = b.updatedAt?.toMillis?.() || b.lastMessageAt?.toMillis?.() || 0;
      return bm - am;
    });
    setChats(list);
    setTotalUnread(list.reduce((sum, c) => sum + (c.unreadCount?.[uid] || 0), 0));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setTotalUnread(0);
      setLoading(false);
      return;
    }
    const asChat = (id: string, data: Record<string, unknown>): Chat => ({ id, ...(data as Omit<Chat, 'id'>) });
    const unsubs: Array<() => void> = [];
    const listen = (field: 'buyerId' | 'sellerId', bucket: { current: Chat[] }) => {
      const apply = (snap: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
        bucket.current = snap.docs.map((d) => asChat(d.id, d.data()));
        merge(user.uid);
      };
      const fallback = () =>
        onSnapshot(
          query(collection(db, 'chats'), where(field, '==', user.uid)),
          apply,
          () => {
            bucket.current = [];
            merge(user.uid);
          },
        );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'chats'), where(field, '==', user.uid), orderBy('updatedAt', 'desc')),
          apply,
          () => unsubs.push(fallback()),
        ),
      );
    };
    listen('buyerId', buyerRows);
    listen('sellerId', sellerRows);
    return () => unsubs.forEach((fn) => fn());
  }, [user, merge]);

  return { chats, loading, totalUnread };
}
