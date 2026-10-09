const functions = require('firebase-functions');
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors')({ origin: true });

admin.initializeApp();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'OGas';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const OGas_EMAIL = 'support@ogaslpgmarketplace.com';
const COMMISSION_RATE = 0.10;

// Gas Points: 1 GP = N1, spendable only inside the app (max 10% of an order).
const REFERRAL_GP = 300;

// October launch promo: order 5kg or more, get 500 GP (in-app gas credit).
const PROMO_MIN_KG = 5;
const PROMO_GP = 500;
const PROMO_END = new Date('2026-11-01T00:00:00+01:00'); // ends midnight Oct 31 WAT

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

async function sendSMS(to, message) {
  if (!TERMII_API_KEY) { console.log('SMS skipped: no Termii key'); return; }
  try {
    const cleanTo = to.replace(/^\+?234/, '234').replace(/^0/, '234');
    const res = await axios.post('https://v3.api.termii.com/api/sms/send', {
      to: cleanTo,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: TERMII_API_KEY,
    });
    console.log('SMS sent:', res.data.message_id || res.data);
    return res.data;
  } catch (err) {
    console.error('SMS failed:', err.response?.data || err.message);
  }
}

async function sendPush(userId, title, body, data = {}) {
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const token = userDoc.data()?.fcmToken;
    if (!token) { console.log('No FCM token for', userId); return; }
    await admin.messaging().send({ token, notification: { title, body }, data });
    console.log('Push sent to:', userId);
  } catch (err) {
    console.error('Push failed:', err.message);
  }
}

async function createTransferRecipient(name, accountNumber, bankCode) {
  const res = await axios.post('https://api.paystack.co/transferrecipient', {
    type: 'nuban',
    name,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: 'NGN',
  }, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' } });
  return res.data.data.recipient_code;
}

async function initiateTransfer(amountKobo, recipientCode, reason) {
  const res = await axios.post('https://api.paystack.co/transfer', {
    source: 'balance',
    amount: Math.round(amountKobo),
    recipient: recipientCode,
    reason,
  }, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' } });
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// EXISTING FUNCTIONS (unchanged)
// ═══════════════════════════════════════════════════════════════

exports.initializePaystackPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { email, amount, reference, metadata, callback_url } = req.body;
      if (!email || !amount) return res.status(400).json({ error: 'Email and amount required' });
      const response = await axios.post('https://api.paystack.co/transaction/initialize', {
        email, amount: amount * 100, reference, metadata,
        callback_url: callback_url || 'https://www.ogaslpgmarketplace.com/payment/callback',
      }, { headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET, 'Content-Type': 'application/json' } });
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Init error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Payment init failed', details: error.response?.data?.message || error.message });
    }
  });
});

exports.verifyPaystackPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { reference } = req.body;
      if (!reference) return res.status(400).json({ error: 'Reference required' });
      const response = await axios.get('https://api.paystack.co/transaction/verify/' + reference, {
        headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET },
      });
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Verify error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Verification failed', details: error.response?.data?.message || error.message });
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// NEW: SELLER BANK DETAILS
// ═══════════════════════════════════════════════════════════════

exports.onOrderCompleted = onDocumentUpdated("orders/{orderId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (before.status === after.status || after.status !== 'completed') return;

  const orderId = event.params.orderId;
  const { sellerId, totalAmount, paystackAmount, buyerPhone, sellerPhone, buyerId, buyerEmail, sellerName } = after;
  const amountKobo = paystackAmount || Math.round(totalAmount * 100);

  const sellerDoc = await admin.firestore().collection('sellers').doc(sellerId).get();
  const seller = sellerDoc.data();

  if (!seller?.bankDetails?.recipientCode) {
    console.error('No bank details for seller:', sellerId);
    await event.data.after.ref.update({ payoutStatus: 'failed', payoutError: 'Seller bank details missing' });
    await sendSMS(sellerPhone, 'URGENT: Add your bank details to OGas to receive payouts. Go to your dashboard now.');
    return;
  }

  const commission = Math.round(amountKobo * COMMISSION_RATE);
  const sellerPayout = amountKobo - commission;

  await event.data.after.ref.update({
    escrowAmount: amountKobo,
    commissionAmount: commission,
    sellerPayoutAmount: sellerPayout,
    payoutStatus: 'processing',
  });

  try {
    const transfer = await initiateTransfer(sellerPayout, seller.bankDetails.recipientCode, `OGas payout - Order ${orderId.slice(-6).toUpperCase()}`);

    await event.data.after.ref.update({
      payoutStatus: 'completed',
      payoutRef: transfer.data.transfer_code,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await admin.firestore().collection('commissions').add({
      orderId, sellerId, amount: commission, rate: COMMISSION_RATE,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await admin.firestore().collection('payouts').add({
      orderId, sellerId, amount: sellerPayout,
      transferCode: transfer.data.transfer_code, status: 'success',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendSMS(sellerPhone, `OGas payout sent! N${(sellerPayout/100).toLocaleString()} to your ${seller.bankDetails.bankName}. Ref: ${transfer.data.transfer_code}`);
    await sendSMS(buyerPhone, `Your OGas order is complete. Thank you!`);
    await sendPush(sellerId, 'Payment Released!', `N${(sellerPayout/100).toLocaleString()} sent to your bank.`, { orderId, type: 'payout' });
    await sendPush(buyerId, 'Order Complete', `Your order with ${sellerName} is finished.`, { orderId, type: 'completed' });

  } catch (error) {
    console.error('Transfer failed:', error.response?.data || error.message);
    await event.data.after.ref.update({
      payoutStatus: 'failed',
      payoutError: error.response?.data?.message || error.message,
    });
    await sendSMS(sellerPhone, `OGas payout failed for order ${orderId.slice(-6)}. Our team will resolve within 24hrs.`);
  }
});

// ═══════════════════════════════════════════════════════════════
// NEW: SMS + PUSH ON EVERY STATUS CHANGE (v2 Firestore trigger)
// ═══════════════════════════════════════════════════════════════

exports.onOrderStatusChanged = onDocumentUpdated("orders/{orderId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (before.status === after.status) return;

  const { status, buyerPhone, sellerPhone, buyerId, sellerId, sellerName, kgAmount, totalAmount } = after;
  const orderId = event.params.orderId;
  const shortId = orderId.slice(-6).toUpperCase();

  switch (status) {
    case 'confirmed':
      await sendSMS(buyerPhone, `${sellerName} confirmed your OGas order (${kgAmount}kg). Preparing for delivery.`);
      await sendPush(buyerId, 'Order Confirmed', `${sellerName} confirmed your ${kgAmount}kg order.`, { orderId, type: 'confirmed' });
      break;

    case 'out_for_delivery':
      await sendSMS(buyerPhone, `Your OGas order (${shortId}) is out for delivery!`);
      await sendPush(buyerId, 'Out for Delivery', 'Your gas is on the way!', { orderId, type: 'out_for_delivery' });
      break;

    case 'delivered':
      await sendSMS(buyerPhone, `OGas order ${shortId} marked delivered. Please confirm receipt in the app to release payment.`);
      await sendPush(buyerId, 'Confirm Delivery', 'Your gas was delivered. Confirm to release payment.', { orderId, type: 'delivered' });
      await sendSMS(sellerPhone, `Your OGas order ${shortId} is delivered. Waiting for buyer confirmation.`);
      break;
  }
});

// ═══════════════════════════════════════════════════════════════
// NEW: FCM TOKEN REGISTRATION
// ═══════════════════════════════════════════════════════════════

exports.registerFCMToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  await admin.firestore().collection('users').doc(context.auth.uid).update({
    fcmToken: data.token,
    fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});

// ═══════════════════════════════════════════════════════════════
// NEW: AUTO-COMPLETE ORDERS
// ═══════════════════════════════════════════════════════════════

exports.autoCompleteDeliveredOrders = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const cutoff = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 48 * 60 * 60 * 1000));
      const snapshot = await admin.firestore().collection('orders')
        .where('status', '==', 'delivered')
        .where('deliveredAt', '<=', cutoff)
        .get();

      const batch = admin.firestore().batch();
      let count = 0;
      snapshot.forEach(doc => {
        batch.update(doc.ref, { status: 'completed', autoCompleted: true });
        count++;
      });
      await batch.commit();

      res.status(200).json({ message: `Auto-completed ${count} orders` });
    } catch (error) {
      console.error('Auto-complete error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ==================== TERMII SMS HELPER ====================
const sendTermiiSMS = async (phone, message) => {
  try {
    const apiKey = process.env.TERMII_API_KEY;
    const senderId = process.env.TERMII_SENDER_ID || 'OGas';
    if (!apiKey) {
      console.log('Termii API key missing, skipping SMS');
      return;
    }

    let to = phone.replace(/\s/g, '').replace(/^\+/, '');
    if (to.startsWith('0')) to = '234' + to.substring(1);
    if (!to.startsWith('234')) to = '234' + to;

    const res = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        to: to,
        from: senderId,
        sms: message,
        type: 'plain',
        channel: 'generic'
      })
    });

    const data = await res.json();
    console.log('Termii SMS sent:', data);
    return data;
  } catch (err) {
    console.error('Termii SMS failed:', err);
  }
};

// ==================== NOTIFY ON ORDER STATUS CHANGE ====================

exports.notifyOnOrderChange = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.status === after.status) return;

  // NEW ORDER (pending) → SMS SELLER
  if (after.status === 'pending' && before.status !== 'pending') {
    const sellerPhone = after.sellerPhone || after.sellerData?.phone;
    if (sellerPhone) {
      const items = (after.items || []).map(i => `${i.quantity}x${i.size}kg`).join(', ');
      const msg = `OGas Order!\nBuyer: ${after.buyerPhone}\nAddr: ${after.buyerAddress}\nAmt: N${after.totalAmount}\nItems: ${items}\nLogin: ogaslpgmarketplace.com/seller/dashboard`;
      await sendTermiiSMS(sellerPhone, msg);
    }
  }

  // OUT FOR DELIVERY → SMS BUYER
  if (after.status === 'out_for_delivery' && before.status !== 'out_for_delivery') {
    if (after.buyerPhone) {
      const msg = `OGas: Your gas order (N${after.totalAmount}) is out for delivery. Track: ogaslpgmarketplace.com/orders`;
      await sendTermiiSMS(after.buyerPhone, msg);
    }
  }

  // DELIVERED → SMS BUYER TO CONFIRM
  if (after.status === 'delivered' && before.status !== 'delivered') {
    if (after.buyerPhone) {
      const msg = `OGas: Your gas has been delivered! Amt: N${after.totalAmount}. Please confirm receipt in the app to release payment to seller.`;
      await sendTermiiSMS(after.buyerPhone, msg);
    }
  }

  // COMPLETED → SMS SELLER (PAYOUT)
  if (after.status === 'completed' && before.status !== 'completed') {
    const sellerPhone = after.sellerPhone || after.sellerData?.phone;
    if (sellerPhone) {
      const payout = Math.round(after.totalAmount * 0.9);
      const msg = `OGas: Order completed! N${payout} will be transferred to your bank account within 24hrs.`;
      await sendTermiiSMS(sellerPhone, msg);
    }
  }
});

// ===== REFERRAL ENGINE (Gas Points) =====
// Buyer's first completed order:
//   - buyer gets 300 GP (in-app credit, spendable up to 10% off any order)
//   - referrer gets 300 GP too — UNLESS the referrer is a registered seller,
//     who keeps the N300 cash bonus in the Earnings Tank (wallet).
// Pays exactly once per buyer (referrals/{referrerId}_{buyerId} idempotency).
exports.onReferralFirstOrder = onDocumentUpdated(
  { document: "orders/{orderId}", region: "europe-west3" },
  async (event) => {
    const before = event.data && event.data.before ? event.data.before.data() : null;
    const after = event.data && event.data.after ? event.data.after.data() : null;
    if (!after || !before) return;
    if (after.status !== 'completed' || before.status === 'completed') return;

    const buyerId = after.buyerId;
    if (!buyerId) return;

    const db = admin.firestore();
    const buyerSnap = await db.collection('users').doc(buyerId).get();
    const buyer = buyerSnap.data();
    if (!buyer) return;

    const referrerId = buyer.referredBy;
    if (!referrerId) return; // not a referral signup

    // One referral pays exactly once
    const referralRef = db.collection('referrals').doc(referrerId + '_' + buyerId);
    const snap = await referralRef.get();
    if (snap.exists && snap.data() && snap.data().paid) return;

    // Sellers earn cash; everyone else earns Gas Points
    const referrerSellerSnap = await db.collection('sellers').doc(referrerId).get();
    const referrerIsSeller = referrerSellerSnap.exists;

    const batch = db.batch();
    batch.set(referralRef, {
      referrerId: referrerId, buyerId: buyerId, orderId: event.params.orderId,
      amount: REFERRAL_GP, currency: referrerIsSeller ? 'NGN' : 'GP', paid: true,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    if (referrerIsSeller) {
      batch.set(db.collection('wallets').doc(referrerId), {
        balance: admin.firestore.FieldValue.increment(REFERRAL_GP),
        totalReferralBonus: admin.firestore.FieldValue.increment(REFERRAL_GP),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      batch.set(db.collection('walletTransactions').doc(), {
        userId: referrerId, type: 'referral_bonus', amount: REFERRAL_GP,
        orderId: event.params.orderId, counterparty: buyerId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      batch.set(db.collection('users').doc(referrerId), {
        gasPoints: admin.firestore.FieldValue.increment(REFERRAL_GP),
      }, { merge: true });
      batch.set(db.collection('pointsTransactions').doc(), {
        uid: referrerId, type: 'earn', points: REFERRAL_GP,
        reason: 'referral', orderId: event.params.orderId, counterparty: buyerId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Buyer welcome bonus: 300 Gas Points
    batch.set(db.collection('users').doc(buyerId), {
      gasPoints: admin.firestore.FieldValue.increment(REFERRAL_GP),
    }, { merge: true });
    batch.set(db.collection('pointsTransactions').doc(), {
      uid: buyerId, type: 'earn', points: REFERRAL_GP,
      reason: 'referral_buyer', orderId: event.params.orderId, counterparty: referrerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();

    await sendPush(
      referrerId,
      'Referral Bonus!',
      referrerIsSeller
        ? 'N300 has entered your Earnings Tank.'
        : `${REFERRAL_GP} Gas Points have entered your tank.`,
      { type: 'referral' }
    );
    await sendPush(buyerId, 'Welcome Bonus!', `${REFERRAL_GP} Gas Points have entered your tank.`, { type: 'referral' });
    console.log('Referral paid: ' + referrerId + ' <- ' + buyerId + (referrerIsSeller ? ' (cash)' : ' (GP)'));
  });

// ===== OCTOBER LAUNCH PROMO: order 5kg+, get 500 Gas Points =====
// Runs on every order completion until Oct 31 2026 (WAT). One bonus per order,
// repeat orders qualify — we WANT heavy users this month.
exports.onPromoFreeKg = onDocumentUpdated(
  { document: "orders/{orderId}", region: "europe-west3" },
  async (event) => {
    const before = event.data && event.data.before ? event.data.before.data() : null;
    const after = event.data && event.data.after ? event.data.after.data() : null;
    if (!after || !before) return;
    if (after.status !== 'completed' || before.status === 'completed') return;

    if (new Date() >= PROMO_END) return;

    const kg = Number(after.kgDelivered || after.kgAmount || after.kg || 0);
    if (kg < PROMO_MIN_KG) return;

    const buyerId = after.buyerId;
    if (!buyerId) return;

    const db = admin.firestore();
    const orderId = event.params.orderId;

    // Idempotency: one promo credit per order
    const promoRef = db.collection('promos').doc('oct2026_' + orderId);
    const promoSnap = await promoRef.get();
    if (promoSnap.exists) return;

    const batch = db.batch();
    batch.set(promoRef, {
      orderId, buyerId, promo: 'oct2026_1kg_free',
      kgOrdered: kg, bonusGP: PROMO_GP,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    batch.set(db.collection('users').doc(buyerId), {
      promoKg: admin.firestore.FieldValue.increment(kg),
      gasPoints: admin.firestore.FieldValue.increment(PROMO_GP),
    }, { merge: true });
    batch.set(db.collection('pointsTransactions').doc(), {
      uid: buyerId, type: 'earn', points: PROMO_GP,
      reason: 'promo_oct2026', orderId,
      note: 'October promo: 500 Gas Points for ordering 5kg+',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();

    await sendPush(
      buyerId,
      '500 Gas Points Earned!',
      `Your ${kg}kg order earned you ${PROMO_GP.toLocaleString()} Gas Points. Promo ends Oct 31.`,
      { type: 'promo', orderId }
    );
    console.log(`Promo credited: ${buyerId} +${PROMO_GP}GP (order ${orderId}, ${kg}kg)`);
  });
