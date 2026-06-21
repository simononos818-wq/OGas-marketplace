import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, doc, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, updateDoc, getDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  type: 'text' | 'image' | 'system' | 'location';
  timestamp: Timestamp;
  readBy: string[];
  imageUrl?: string;
  location?: { latitude: number; longitude: number; address?: string };
}

export interface Chat {
  id: string;
  participants: string[];
  orderId: string;
  lastMessage: { text: string; senderId: string; timestamp: Timestamp };
  unreadCount: Record<string, number>;
  typing: Record<string, Timestamp | null>;
  updatedAt: Timestamp;
  otherUser?: { displayName: string; photoURL?: string; phoneNumber?: 
string };
}

export function useChat(chatId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInfo, setChatInfo] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !user) return;
    const chatRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const otherUserId = data.participants.find((id: string) => id !== 
user.uid);
        let otherUserInfo = null;
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) otherUserInfo = userDoc.data();
        }
        setChatInfo({
          id: snapshot.id, ...data,
          otherUser: otherUserInfo ? {
            displayName: otherUserInfo.displayName || 'User',
            photoURL: otherUserInfo.photoURL,
            phoneNumber: otherUserInfo.phoneNumber,
          } : undefined,
        } as Chat);

        if (otherUserId && data.typing?.[otherUserId]) {
          const typingTime = data.typing[otherUserId].toDate();
          if (new Date().getTime() - typingTime.getTime() < 30000) 
setOtherUserTyping(true);
          else setOtherUserTyping(false);
        } else setOtherUserTyping(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [chatId, user]);

  useEffect(() => {
    if (!chatId || !user) return;
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() } as 
ChatMessage));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [chatId, user]);

  useEffect(() => {
    if (!chatId || !user) return;
    const markAsRead = async () => {
      try {
        const markReadFn = httpsCallable(functions, 'markMessagesAsRead');
        await markReadFn({ chatId });
      } catch (error) { console.error('Error marking messages as read:', 
error); }
    };
    markAsRead();
  }, [chatId, user]);

  const sendMessage = useCallback(async (text: string) => {
    if (!chatId || !user || !text.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: text.trim(), senderId: user.uid, senderName: 
user.displayName || 'User',
        senderPhoto: user.photoURL || null, type: 'text', timestamp: 
serverTimestamp(), readBy: [user.uid],
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: { text: text.trim(), senderId: user.uid, timestamp: 
serverTimestamp() },
        updatedAt: serverTimestamp(),
      });
    } catch (error) { console.error('Error sending message:', error); 
throw error; }
    finally { setSending(false); }
  }, [chatId, user]);

  const sendLocationMessage = useCallback(async (latitude: number, 
longitude: number, address?: string) => {
    if (!chatId || !user) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: address || '📍 Shared location', senderId: user.uid, 
senderName: user.displayName || 'User',
        senderPhoto: user.photoURL || null, type: 'location', location: { 
latitude, longitude, address },
        timestamp: serverTimestamp(), readBy: [user.uid],
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: { text: address || '📍 Shared location', senderId: 
user.uid, timestamp: serverTimestamp() },
        updatedAt: serverTimestamp(),
      });
    } catch (error) { console.error('Error sending location:', error); 
throw error; }
    finally { setSending(false); }
  }, [chatId, user]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!chatId || !user) return;
    try {
      const updateTypingFn = httpsCallable(functions, 
'updateTypingStatus');
      await updateTypingFn({ chatId, isTyping });
    } catch (error) { console.error('Error updating typing status:', 
error); }
  }, [chatId, user]);

  const handleTyping = useCallback(() => {
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
  }, [setTyping]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return {
    messages, chatInfo, loading, sending, otherUserTyping,
    sendMessage, sendLocationMessage, handleTyping, scrollToBottom, 
messagesEndRef,
  };
}

export function useChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const chatsRef = collection(db, 'chats');
    const unsubscribe = onSnapshot(chatsRef, async (snapshot) => {
      const chatList: Chat[] = [];
      let unread = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.participants?.includes(user.uid)) {
          const otherUserId = data.participants.find((id: string) => id 
!== user.uid);
          let otherUserInfo = null;
          if (otherUserId) {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) otherUserInfo = userDoc.data();
          }
          chatList.push({
            id: docSnap.id, ...data,
            otherUser: otherUserInfo ? {
              displayName: otherUserInfo.displayName || 'User',
              photoURL: otherUserInfo.photoURL,
              phoneNumber: otherUserInfo.phoneNumber,
            } : undefined,
          } as Chat);
          unread += data.unreadCount?.[user.uid] || 0;
        }
      }
      chatList.sort((a, b) => b.updatedAt?.toMillis() - 
a.updatedAt?.toMillis());
      setChats(chatList);
      setTotalUnread(unread);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return { chats, loading, totalUnread };
}
