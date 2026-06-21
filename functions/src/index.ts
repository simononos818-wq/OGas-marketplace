import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();
const db = admin.firestore();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET || '';
const TERMII_API_KEY = process.env.TERMII_API_KEY || '';
const TERMII_SENDER_ID = 'N-Alert';

async function sendSMS(to: string, message: string) {
  try {
    let phone = to.replace(/\s/g, '');
    if (phone.startsWith('0')) phone = '234' + phone.substring(1);
    if (phone.startsWith('+')) phone = phone.substring(1);

    const response = await axios.post('https://v3.api.termii.com/api/sms/send', {
      to: [phone],
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      api_key: TERMII_API_KEY,
      channel: 'dnd',
    });
    
    console.log('SMS sent to', phone, 'Response:', response.data);
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
            'OGas: Payment confirmed! Order #' + orderId.slice(-6) + ' is being processed. You will receive updates via SMS.'
          );
          
          const sellerDoc = await db.collection('sellers').doc(order.sellerId).get();
          const seller = sellerDoc.data();
          if (seller?.phone) {
            await sendSMS(
              seller.phone,
              'OGas: New order #' + orderId.slice(-6) + ' from ' + order.buyerName + '. Amount: N' + order.totalAmount + '. Check your dashboard.'
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
  
  if (event.event === 'transfer.success') {
    const transferCode = event.data?.transfer_code;
    if (transferCode) {
      const payouts = await db.collection('payouts')
        .where('paystackTransferCode', '==', transferCode)
        .get();
      
      for (const doc of payouts.docs) {
        await doc.ref.update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
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
      text: 'Order #' + orderId.slice(-6) + ' created. Chat with your seller about delivery details.',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });
    
    await snap.ref.update({ chatId });
    
    await sendSMS(
      order.buyerPhone,
      'OGas: Order #' + orderId.slice(-6) + ' placed! Total: N' + order.totalAmount + '. Status: ' + (order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Awaiting Payment') + '.'
    );
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
      delivered: 'Your gas has been delivered. Thank you for using OGas!',
      cancelled: 'Your order has been cancelled. Contact support if you need help.',
    };
    
    const message = statusMessages[after.status];
    if (message) {
      await sendSMS(
        after.buyerPhone,
        'OGas Order #' + orderId.slice(-6) + ': ' + message
      );
    }
    
    if (after.status === 'out_for_delivery') {
      const sellerDoc = await db.collection('sellers').doc(after.sellerId).get();
      const seller = sellerDoc.data();
      if (seller?.phone) {
        await sendSMS(
          seller.phone,
          'OGas: Order #' + orderId.slice(-6) + ' is out for delivery. Make sure the gas reaches the customer.'
        );
      }
    }
  });

export const notifySellerNewOrder = functions.region('europe-west3').firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;
    
    const sellerDoc = await db.collection('sellers').doc(order.sellerId).get();
    const seller = sellerDoc.data();
    
    if (seller?.phone) {
      const items = order.items?.map((i: any) => i.quantity + 'x' + i.size + 'kg').join(', ');
      await sendSMS(
        seller.phone,
        'OGas NEW ORDER #' + orderId.slice(-6) + ': ' + items + '. Total: N' + order.totalAmount + '. Delivery: ' + order.buyerAddress + '. Call: ' + order.buyerPhone
      );
    }
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

export const autoPayoutOnDelivery = functions.region('europe-west3').firestore
  .document('orders/{orderId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status === 'delivered' || after.status !== 'delivered') return;
    
    const orderId = change.after.id;
    const sellerId = after.sellerId;
    const amount = after.totalAmount || 0;
    
    if (!sellerId || amount <= 0) return;
    
    const sellerDoc = await db.collection('sellers').doc(sellerId).get();
    const seller = sellerDoc.data();
    
    if (!seller?.bankCode || !seller?.accountNumber) {
      console.log('Seller ' + sellerId + ' has no bank details. Payout queued.');
      await db.collection('payouts').add({
        orderId,
        sellerId,
        amount,
        status: 'pending_bank_details',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }
    
    try {
      const transferRef = 'payout_' + orderId + '_' + Date.now();
      
      const response = await axios.post(
        'https://api.paystack.co/transfer',
        {
          source: 'balance',
          amount: amount * 100,
          recipient: seller.paystackRecipientCode || '',
          reason: 'OGas Order #' + orderId.slice(-6),
          reference: transferRef,
        },
        {
          headers: {
            Authorization: 'Bearer ' + PAYSTACK_SECRET,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if ((response.data as any).status) {
        await db.collection('payouts').add({
          orderId,
          sellerId,
          amount,
          status: 'initiated',
          paystackReference: transferRef,
          paystackTransferCode: (response.data as any).data?.transfer_code,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        await sellerDoc.ref.update({
          totalEarnings: admin.firestore.FieldValue.increment(amount),
          pendingPayouts: admin.firestore.FieldValue.increment(-amount),
        });
        
        if (seller.phone) {
          await sendSMS(
            seller.phone,
            'OGas: Payout of N' + amount + ' for Order #' + orderId.slice(-6) + ' has been initiated to your bank account.'
          );
        }
        
        console.log('Payout initiated for order ' + orderId + ': N' + amount);
      }
    } catch (error: any) {
      console.error('Payout failed:', error.response?.data || error.message);
      await db.collection('payouts').add({
        orderId,
        sellerId,
        amount,
        status: 'failed',
        error: error.response?.data?.message || error.message,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
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
      'https://api.paystack.co/bank/resolve?account_number=' + accountNumber + '&bank_code=' + bankCode,
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
