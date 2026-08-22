import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';
import {
  bodyForQuickKey,
  ChatRole,
  redactPrivate,
  SYSTEM_COPY,
  systemCopyForStatus,
} from './chat';
import { sendSms } from './sms';

export type OrderChatSource = {
  id: string;
  buyerId: string;
  sellerId: string;
  buyerName?: string;
  sellerName?: string;
  buyerPhone?: string;
  sellerPhone?: string;
  gasSize?: string;
  quantity?: number;
  items?: { size?: string; quantity?: number }[];
};

function productLabel(order: OrderChatSource) {
  if (order.gasSize) return `${order.gasSize}kg × ${order.quantity || 1}`;
  const first = order.items?.[0];
  if (first?.size) return `${first.size} × ${first.quantity || 1}`;
  return 'LPG order';
}

function phonesOnOrder(order: { buyerPhone?: string; sellerPhone?: string }) {
  return [order.buyerPhone, order.sellerPhone].filter(Boolean) as string[];
}

async function doorCodeFor(orderId: string) {
  const snap = await adminDb.collection('orderSecrets').doc(orderId).get();
  return (snap.data()?.doorCode as string | undefined) || null;
}

export async function openOrderChat(order: OrderChatSource) {
  const chatRef = adminDb.collection('chats').doc(order.id);
  const msgRef = chatRef.collection('messages').doc();
  let created = false;

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(chatRef);
    if (snap.exists) return;
    created = true;
    const now = FieldValue.serverTimestamp();
    tx.set(chatRef, {
      orderId: order.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      participants: [order.buyerId, order.sellerId].filter(Boolean),
      buyerName: order.buyerName || 'Buyer',
      sellerName: order.sellerName || 'Store',
      productLabel: productLabel(order),
      lastMessage: SYSTEM_COPY.placed,
      lastMessageAt: now,
      lastSenderId: 'system',
      lastSenderRole: 'system',
      unreadCount: { [order.buyerId]: 0, [order.sellerId]: 0 },
      lastSendAt: {},
      lastSmsAt: {},
      createdAt: now,
      updatedAt: now,
    });
    tx.set(msgRef, {
      text: SYSTEM_COPY.placed,
      senderId: 'system',
      senderRole: 'system',
      senderName: 'OGas',
      type: 'system',
      timestamp: now,
      readBy: [],
    });
  });

  return { chatId: order.id, created };
}

export async function postSystemMessage(orderId: string, statusOrBody: string) {
  const body = systemCopyForStatus(statusOrBody) || statusOrBody;
  if (!body) return;
  const chatRef = adminDb.collection('chats').doc(orderId);
  const chatSnap = await chatRef.get();
  if (!chatSnap.exists) {
    const orderSnap = await adminDb.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) return;
    await openOrderChat({ id: orderId, ...(orderSnap.data() as Omit<OrderChatSource, 'id'>) });
  }
  const now = FieldValue.serverTimestamp();
  await chatRef.collection('messages').add({
    text: body,
    senderId: 'system',
    senderRole: 'system',
    senderName: 'OGas',
    type: 'system',
    timestamp: now,
    readBy: [],
  });
  await chatRef.set(
    {
      lastMessage: body,
      lastMessageAt: now,
      lastSenderId: 'system',
      lastSenderRole: 'system',
      updatedAt: now,
    },
    { merge: true },
  );
}

export async function sendChatMessage(opts: {
  uid: string;
  chatId: string;
  text?: string;
  quickKey?: string;
}) {
  const chatRef = adminDb.collection('chats').doc(opts.chatId);
  const chatSnap = await chatRef.get();
  if (!chatSnap.exists) {
    const orderSnap = await adminDb.collection('orders').doc(opts.chatId).get();
    if (!orderSnap.exists) throw new Error('Chat not found');
    const order = orderSnap.data()!;
    if (order.buyerId !== opts.uid && order.sellerId !== opts.uid) {
      throw new Error('Not your order');
    }
    await openOrderChat({ id: opts.chatId, ...(order as Omit<OrderChatSource, 'id'>) });
  }

  const chat = (await chatRef.get()).data()!;
  const participants: string[] = chat.participants || [chat.buyerId, chat.sellerId];
  if (!participants.includes(opts.uid)) throw new Error('Not your chat');

  const role: ChatRole = chat.sellerId === opts.uid ? 'seller' : 'buyer';
  const raw = opts.quickKey ? bodyForQuickKey(opts.quickKey, role) : String(opts.text || '');
  if (!raw) throw new Error('Type a message');
  if (raw.length > 500) throw new Error('Message is too long');

  const lastSend = chat.lastSendAt?.[opts.uid]?.toMillis?.() || 0;
  if (lastSend && Date.now() - lastSend < 700) throw new Error('Slow down a second');

  const orderSnap = await adminDb.collection('orders').doc(chat.orderId || opts.chatId).get();
  const order = orderSnap.data() || {};
  const doorCode = await doorCodeFor(chat.orderId || opts.chatId);
  const text = redactPrivate(raw, doorCode, phonesOnOrder(order as { buyerPhone?: string; sellerPhone?: string }));
  if (!text) throw new Error('That message cannot be sent');

  const otherId = role === 'buyer' ? chat.sellerId : chat.buyerId;
  const now = FieldValue.serverTimestamp();
  const senderName = role === 'seller' ? chat.sellerName || 'Store' : chat.buyerName || 'Buyer';

  await chatRef.collection('messages').add({
    text,
    senderId: opts.uid,
    senderRole: role,
    senderName,
    type: 'text',
    quickKey: opts.quickKey || null,
    timestamp: now,
    readBy: [opts.uid],
  });

  await chatRef.set(
    {
      lastMessage: text,
      lastMessageAt: now,
      lastSenderId: opts.uid,
      lastSenderRole: role,
      updatedAt: now,
      [`unreadCount.${otherId}`]: FieldValue.increment(1),
      [`unreadCount.${opts.uid}`]: 0,
      [`lastSendAt.${opts.uid}`]: now,
    },
    { merge: true },
  );

  await pingCounterpart(opts.chatId, otherId, role, order as { buyerPhone?: string; sellerPhone?: string }, chat);

  return { text, role };
}

async function pingCounterpart(
  chatId: string,
  otherId: string,
  fromRole: ChatRole,
  order: { buyerPhone?: string; sellerPhone?: string },
  chat: DocumentData,
) {
  const lastSms = chat.lastSmsAt?.[otherId]?.toMillis?.() || 0;
  if (lastSms && Date.now() - lastSms < 5 * 60 * 1000) return;
  const phone = fromRole === 'buyer' ? order.sellerPhone : order.buyerPhone;
  const short = chatId.slice(-6).toUpperCase();
  const who = fromRole === 'buyer' ? 'buyer' : 'store';
  await sendSms(
    phone || '',
    `OGas: new message from the ${who} on order #${short}. Open Messages in the app to reply — numbers stay private.`,
  );
  await adminDb.collection('chats').doc(chatId).set(
    { [`lastSmsAt.${otherId}`]: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function markChatRead(uid: string, chatId: string) {
  const chatRef = adminDb.collection('chats').doc(chatId);
  const snap = await chatRef.get();
  if (!snap.exists) return;
  const chat = snap.data()!;
  const participants: string[] = chat.participants || [chat.buyerId, chat.sellerId];
  if (!participants.includes(uid)) return;
  await chatRef.set({ [`unreadCount.${uid}`]: 0 }, { merge: true });
}
