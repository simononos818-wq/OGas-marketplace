const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const PAYSTACK_SECRET_KEY = defineSecret('PAYSTACK_SECRET_KEY');

// ==================== 1. GEMINI AI CHAT ====================
exports.geminiChat = onRequest(
  { secrets: [GEMINI_API_KEY], cors: true, region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, systemPrompt } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    try {
      const apiKey = GEMINI_API_KEY.value();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const contents = [];
      if (systemPrompt) {
        contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
        contents.push({ role: 'model', parts: [{ text: 'Understood. I will help as described.' }] });
      }
      for (const m of messages) {
        contents.push({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 512 } }),
      });

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't respond right now.";
      return res.json({ text });
    } catch (err) {
      console.error('Gemini proxy error:', err);
      return res.status(500).json({ error: 'AI service unavailable' });
    }
  }
);

// ==================== 2. PAYSTACK WEBHOOK ====================
exports.paystackWebhook = onRequest(
  { secrets: [PAYSTACK_SECRET_KEY], cors: true, region: 'us-central1' },
  async (req, res) => {
    try {
      const event = req.body;
      if (event.event === 'charge.success') {
        const { reference, metadata } = event.data;
        const orderId = metadata?.orderId;

        if (!orderId) {
          return res.status(400).send('No orderId');
        }

        // Verify with Paystack
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY.value()}` }
        });
        const verifyData = await verifyRes.json();

        if (verifyData.data?.status === 'success') {
          await db.collection('orders').doc(orderId).update({
            status: 'paid',
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            paystackReference: reference,
            paystackAmount: verifyData.data.amount / 100,
          });

          // Notify seller
          const orderDoc = await db.collection('orders').doc(orderId).get();
          const order = orderDoc.data();
          if (order?.sellerId) {
            const sellerDoc = await db.collection('sellers').doc(order.sellerId).get();
            const seller = sellerDoc.data();
            if (seller?.fcmToken) {
              await admin.messaging().send({
                token: seller.fcmToken,
                notification: {
                  title: '🔥 Payment Received!',
                  body: `₦${(verifyData.data.amount / 100).toLocaleString()} paid for order`,
                },
                data: { type: 'payment_received', orderId },
              });
            }
          }
        }
      }
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Error');
    }
  }
);

// ==================== 3. INITIATE PAYOUT ====================
exports.initiatePayout = onRequest(
  { secrets: [PAYSTACK_SECRET_KEY], cors: true, region: 'us-central1' },
  async (req, res) => {
    try {
      const { sellerId, amount, orderId } = req.body;
      if (!sellerId || !amount || !orderId) {
        return res.status(400).json({ error: 'Missing sellerId, amount, or orderId' });
      }

      const sellerDoc = await db.collection('sellers').doc(sellerId).get();
      const seller = sellerDoc.data();

      if (!seller?.bankDetails?.recipientCode) {
        return res.status(400).json({ error: 'Seller bank not set up' });
      }

      const transferRes = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY.value()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'balance',
          amount: amount * 100,
          recipient: seller.bankDetails.recipientCode,
          reason: `OGas payout for order ${orderId}`,
          reference: `ogas_payout_${orderId}_${Date.now()}`,
        }),
      });

      const transferData = await transferRes.json();

      if (transferData.status) {
        await db.collection('orders').doc(orderId).update({
          payoutStatus: 'initiated',
          payoutReference: transferData.data.reference,
          payoutInitiatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.json({ success: true, reference: transferData.data.reference });
      } else {
        return res.status(400).json({ error: transferData.message });
      }
    } catch (error) {
      console.error('Payout error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ==================== 4. REGISTER FCM TOKEN ====================
exports.registerFcmToken = onRequest(
  { cors: true, region: 'us-central1' },
  async (req, res) => {
    try {
      const { userId, fcmToken, userType } = req.body;
      const collection = userType === 'seller' ? 'sellers' : 'users';
      await db.collection(collection).doc(userId).update({ fcmToken });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ==================== 5. ORDER NOTIFICATIONS ====================
exports.onOrderCreated = onDocumentCreated('orders/{orderId}', async (event) => {
  const order = event.data.data();
  if (!order?.sellerId) return;

  const sellerDoc = await db.collection('sellers').doc(order.sellerId).get();
  const seller = sellerDoc.data();
  if (!seller?.fcmToken) return;

  await admin.messaging().send({
    token: seller.fcmToken,
    notification: {
      title: '🛒 New OGas Order!',
      body: `${order.gasSize || order.cylinderSize}kg — ₦${(order.totalPrice || 0).toLocaleString()}`,
    },
    data: { type: 'new_order', orderId: event.params.orderId },
  });
});

// ==================== 6. DAILY SUMMARY ====================
exports.dailySummary = onSchedule(
  { schedule: '0 8 * * *', region: 'us-central1' },
  async (event) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const sellersSnap = await db.collection('sellers').where('isActive', '==', true).get();

    for (const sellerDoc of sellersSnap.docs) {
      const seller = sellerDoc.data();
      if (!seller.fcmToken) continue;

      const ordersSnap = await db.collection('orders')
        .where('sellerId', '==', sellerDoc.id)
        .where('createdAt', '>=', yesterday)
        .get();

      const revenue = ordersSnap.docs.reduce((sum, d) => sum + (d.data().totalPrice || 0), 0);

      await admin.messaging().send({
        token: seller.fcmToken,
        notification: {
          title: '📊 Your Daily OGas Report',
          body: `Yesterday: ${ordersSnap.size} orders, ₦${revenue.toLocaleString()} revenue`,
        },
        data: { type: 'daily_report' },
      });
    }
  }
);

// ==================== 7. HEALTH CHECK ====================
exports.healthCheck = onRequest(
  { region: 'us-central1' },
  (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'OGas' });
  }
);
require('./fixSellers');

// ==================== 8. AUTO-FIX SELLERS ====================
exports.fixSellers = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    try {
      const sellersSnap = await db.collection('sellers').get();
      let fixed = 0;
      let deactivated = 0;

      for (const doc of sellersSnap.docs) {
        const data = doc.data();
        const updates = {};

        if (data.isMock === true) {
          updates.isAvailable = false;
          updates.isVerified = false;
          deactivated++;
        } else {
          updates.isVerified = true;
          updates.isAvailable = true;
          
          if (!data.gasSizes && data.prices) {
            updates.gasSizes = Object.keys(data.prices);
          }
          if (!data.deliveryFee) {
            updates.deliveryFee = 500;
          }
          if (!data.hasDelivery && data.hasDelivery !== false) {
            updates.hasDelivery = true;
          }
          if (!data.totalOrders && data.totalOrders !== 0) {
            updates.totalOrders = 0;
          }
          fixed++;
        }

        await doc.ref.update(updates);
      }

      res.json({ 
        success: true, 
        message: `Fixed ${fixed} real sellers, deactivated ${deactivated} mock sellers`,
        fixed,
        deactivated
      });
    } catch (error) {
      console.error('Fix sellers error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
require('./checkCollections');
exports.checkCollections = require('./checkCollections').checkCollections;
exports.getVendors = require('./getVendors').getVendors;
exports.registerSeller = require('./registerSeller').registerSeller;
exports.registerSeller = require('./registerSeller').registerSeller;
exports.createOrder = require('./createOrder').createOrder;
exports.getOrders = require('./getOrders').getOrders;
exports.updateOrderStatus = require('./updateOrderStatus').updateOrderStatus;
exports.sendMessage = require('./sendMessage').sendMessage;
exports.getMessages = require('./getMessages').getMessages;
