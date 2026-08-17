import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();
const db = admin.firestore();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET || '';
const TERMII_API_KEY = process.env.TERMII_API_KEY || '';
const TERMII_SENDER_ID = 'N-Alert';
const OGAS_COMMISSION_PERCENT = 10;

async function sendSMS(to: string, message: string) {
  try {
    let phone = to.replace(/\s/g, '');
    if (phone.startsWith('0')) phone = '234' + phone.substring(1);
    if (phone.startsWith('+')) phone = phone.substring(1);

    await axios.post('https://v3.api.termii.com/api/sms/send', {
      to: [phone],
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      api_key: TERMII_API_KEY,
      channel: 'dnd',
    });
  } catch (error: any) {
    console.error('SMS failed:', error.response?.data || error.message);
  }
}

export const paystackWebhook = functions.https.onRequest(async (req, res) => {
  const event = req.body;
  
  if (event.event === 'charge.success') {
    const data = event.data;
    const reference = data.reference;
    
    if (reference && reference.startsWith('OGAS_')) {
      const orderId = reference.split('_')[1];
      
      try {
        await db.collection('orders').doc(orderId).update({
          status: 'paid',
          paymentStatus: 'paid',
          paystackRef: reference,
          paystackData: data,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        const orderDoc = await db.collection('orders').doc(orderId).get();
        const order = orderDoc.data();
        
        if (order) {
          await sendSMS(
            order.buyerPhone,
            `OGas: Payment confirmed! Order #${orderId.slice(-6)} is being processed.`
          );
          
          const sellerDoc = await db.collection('sellers').doc(order.sellerId).get();
          const seller = sellerDoc.data();
          if (seller?.phone) {
            await sendSMS(
              seller.phone,
              `OGas: New order #${orderId.slice(-6)} from ${order.buyerName}. Amount: N${order.totalAmount}.`
            );
          }
        }
        
        res.status(200).send('OK');
        return;
      } catch (e) {
        console.error('Webhook error:', e);
        res.status(500).send('Error');
        return;
      }
    }
  }
  
  res.status(200).send('OK');
});

export const createChatOnOrder = functions.region('europe-west3').firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;
    const buyerId = order.buyerId;
    const sellerId = order.sellerId;
    
    if (!buyerId || !sellerId) return;
    
    const chatId = [buyerId, sellerId].sort().join('_');
    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();
    
    if (!chatDoc.exists) {
      await chatRef.set({
        participants: [buyerId, sellerId],
        orderId: orderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: '',
        unreadCount: { [buyerId]: 0, [sellerId]: 0 },
      });
    }
    
    const messagesRef = chatRef.collection('messages');
    await messagesRef.add({
      senderId: 'system',
      text: `Order #${orderId.slice(-6)} created. Chat with your seller about delivery details.`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });
    
    await snap.ref.update({ chatId });
    
    await sendSMS(
      order.buyerPhone,
      `OGas: Order #${orderId.slice(-6)} placed! Total: N${order.totalAmount}.`
    );
  });

export const notifySellerNewOrder = functions.region('europe-west3').firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;
    
    const sellerDoc = await db.collection('sellers').doc(order.sellerId).get();
    const seller = sellerDoc.data();
    
    if (seller?.phone) {
      const items = order.items?.map((i: any) => `${i.quantity}x${i.size}kg`).join(', ');
      await sendSMS(
        seller.phone,
        `OGas NEW ORDER #${orderId.slice(-6)}: ${items}. Total: N${order.totalAmount}. Call: ${order.buyerPhone}`
      );
    }
  });

export const notifyOrderStatusUpdate = functions.region('europe-west3').firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const orderId = context.params.orderId;
    
    if (before.status === after.status) return;
    
    const statusMessages: Record<string, string> = {
      paid: 'Payment confirmed! Your order is being processed.',
      preparing: 'Your order is being prepared for delivery.',
      out_for_delivery: 'Your gas is on the way! Get ready to receive it.',
      delivered: 'Your gas has been delivered. Please confirm receipt to complete the order.',
      completed: 'Order completed! Thank you for using OGas.',
      cancelled: 'Your order has been cancelled.',
    };
    
    const message = statusMessages[after.status];
    if (message) {
      await sendSMS(
        after.buyerPhone,
        `OGas Order #${orderId.slice(-6)}: ${message}`
      );
    }
    
    if (after.status === 'delivered' && before.status !== 'delivered') {
      const confirmUrl = `https://www.ogaslpgmarketplace.com/orders/${orderId}/confirm`;
      await sendSMS(
        after.buyerPhone,
        `OGas: Confirm you received your gas: ${confirmUrl} or reply YES.`
      );
    }
  });

export const confirmDelivery = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const { orderId } = data;
  const userId = context.auth.uid;

  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Order not found');
  }

  const order = orderDoc.data()!;

  if (order.buyerId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Only buyer can confirm');
  }

  if (order.status !== 'delivered') {
    throw new functions.https.HttpsError('failed-precondition', 'Order not yet delivered');
  }

  const totalAmount = order.totalAmount || 0;
  const commission = Math.round(totalAmount * (OGAS_COMMISSION_PERCENT / 100));
  const sellerEarnings = totalAmount - commission;

  await orderRef.update({
    status: 'completed',
    buyerConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
    commission: commission,
    sellerEarnings: sellerEarnings,
    payoutStatus: 'pending',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const sellerRef = db.collection('sellers').doc(order.sellerId);
  await sellerRef.update({
    totalEarnings: admin.firestore.FieldValue.increment(sellerEarnings),
    totalOrders: admin.firestore.FieldValue.increment(1),
    totalCommissionPaid: admin.firestore.FieldValue.increment(commission),
    pendingPayout: admin.firestore.FieldValue.increment(sellerEarnings),
  });

  await sendSMS(
    order.buyerPhone,
    `OGas: Order #${orderId.slice(-6)} completed! Thank you.`
  );

  const sellerDoc = await db.collection('sellers').doc(order.sellerId).get();
  const seller = sellerDoc.data();
  if (seller?.phone) {
    await sendSMS(
      seller.phone,
      `OGas: Order #${orderId.slice(-6)} confirmed! N${sellerEarnings} ready for withdrawal.`
    );
  }

  return {
    success: true,
    commission,
    sellerEarnings,
    message: 'Delivery confirmed. Seller can now withdraw earnings.',
  };
});

export const sendMessageNotification = functions.region('europe-west3').firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const chatId = context.params.chatId;
    
    if (message.senderId === 'system') return;
    
    const chatDoc = await db.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) return;
    
    const chat = chatDoc.data()!;
    const recipientId = chat.participants.find((p: string) => p !== message.senderId);
    if (!recipientId) return;
    
    const unreadUpdate: Record<string, any> = {};
    unreadUpdate['unreadCount.' + recipientId] = admin.firestore.FieldValue.increment(1);
    unreadUpdate['lastMessage'] = message.text;
    unreadUpdate['updatedAt'] = admin.firestore.FieldValue.serverTimestamp();
    await chatDoc.ref.update(unreadUpdate);
    
    const userDoc = await db.collection('users').doc(recipientId).get();
    const fcmToken = userDoc.data()?.fcmToken;
    const phone = userDoc.data()?.phoneNumber;
    
    if (fcmToken) {
      const senderDoc = await db.collection('users').doc(message.senderId).get();
      const senderName = senderDoc.data()?.displayName || 'OGas User';
      
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: 'New message from ' + senderName,
          body: message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text,
        },
        data: { chatId, type: 'chat_message' },
      });
    }
    
    if (phone) {
      await sendSMS(phone, 'OGas: New message: "' + message.text.substring(0, 100) + '"');
    }
  });

export const markMessagesAsRead = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  
  const { chatId } = data;
  const userId = context.auth.uid;
  
  const messagesRef = db.collection('chats').doc(chatId).collection('messages');
  const unreadSnapshot = await messagesRef
    .where('read', '==', false)
    .where('senderId', '!=', userId)
    .get();
  
  const batch = db.batch();
  unreadSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });
  
  batch.update(db.collection('chats').doc(chatId), {
    ['unreadCount.' + userId]: 0,
  });
  
  await batch.commit();
  return { success: true, markedRead: unreadSnapshot.size };
});

export const updateTypingStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  
  const { chatId, isTyping } = data;
  const userId = context.auth.uid;
  
  await db.collection('chats').doc(chatId).update({
    ['typing.' + userId]: isTyping ? admin.firestore.FieldValue.serverTimestamp() : null,
  });
  
  return { success: true };
});

export const cleanupTypingStatus = functions.pubsub.schedule('every 5 minutes').onRun(async () => {
  const fiveMinutesAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000));
  const chatsSnapshot = await db.collection('chats').get();
  
  const batch = db.batch();
  let operations = 0;
  
  for (const chatDoc of chatsSnapshot.docs) {
    const chat = chatDoc.data();
    const typing = chat.typing || {};
    
    for (const [userId, timestamp] of Object.entries(typing as Record<string, any>)) {
      if (timestamp && timestamp.toDate && timestamp.toDate() < fiveMinutesAgo) {
        batch.update(chatDoc.ref, {
          ['typing.' + userId]: admin.firestore.FieldValue.delete(),
        });
        operations++;
      }
    }
    
    if (operations >= 400) {
      await batch.commit();
      operations = 0;
    }
  }
  
  if (operations > 0) {
    await batch.commit();
  }
});

export const getPaystackBanks = functions.https.onCall(async () => {
  try {
    const response = await axios.get('https://api.paystack.co/bank?country=nigeria', {
      headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET },
    });
    return { banks: (response.data as any).data || [] };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.response?.data?.message || 'Failed to fetch banks');
  }
});

export const verifyBankAccount = functions.https.onCall(async (data) => {
  const { accountNumber, bankCode } = data;
  
  if (!accountNumber || !bankCode) {
    throw new functions.https.HttpsError('invalid-argument', 'Account number and bank code required');
  }
  
  try {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      { headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET } }
    );
    
    return {
      valid: true,
      accountName: (response.data as any).data?.account_name,
      accountNumber: (response.data as any).data?.account_number,
    };
  } catch (error: any) {
    return {
      valid: false,
      message: error.response?.data?.message || 'Could not verify account',
    };
  }
});

export const getSellerPayouts = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  
  const sellerId = context.auth.uid;
  const payoutsSnapshot = await db
    .collection('payouts')
    .where('sellerId', '==', sellerId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  
  const payouts = payoutsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  return { payouts };
});

// ==================== CREATE ORDER (HTTP with CORS) ====================
export const createOrder = functions.https.onRequest(async (req, res) => {
  // CORS headers — REQUIRED for browser fetch
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle browser preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { buyerId, sellerId, items, deliveryAddress, deliveryFee, subtotal, total, notes, delivery } = req.body;

    if (!buyerId || !sellerId || !Array.isArray(items) || items.length === 0 || total == null) {
      res.status(400).json({ error: 'Missing required fields: buyerId, sellerId, items, total' });
      return;
    }

    const firstItem = items[0];

    // Pull buyer details from user profile
    const userDoc = await db.collection('users').doc(buyerId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const orderData = {
      buyerId,
      buyerName: userData?.displayName || userData?.name || '',
      buyerPhone: userData?.phone || '',
      buyerAddress: deliveryAddress || '',
      sellerId,
      items,
      size: firstItem?.kg ?? firstItem?.size ?? null,
      quantity: firstItem?.quantity ?? 1,
      pricePerUnit: firstItem?.price ?? 0,
      delivery: !!delivery,
      deliveryFee: Number(deliveryFee) || 0,
      subtotal: Number(subtotal) || 0,
      total: Number(total) || 0,
      notes: notes || '',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('orders').add(orderData);

    // Increment seller order count
    await db.collection('sellers').doc(sellerId).update({
      totalOrders: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      success: true,
      message: 'Order placed successfully!',
      orderId: docRef.id,
    });

  } catch (error: any) {
    console.error('createOrder error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
