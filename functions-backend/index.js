const { onSchedule } = require('firebase-functions/v2/scheduler');
const functions = require('firebase-functions');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors')({ origin: true });

admin.initializeApp();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const TERMII_API_KEY = process.env.TERMII_API_KEY;
// Sender ID is exactly "OGas" — approved 2026-11-23. Case-sensitive: "OGAS" fails.
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'OGas';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const OGas_EMAIL = 'support@ogaslpgmarketplace.com';

// Commission lives in exactly one place: OGAS_COMMISSION_PERCENT in
// lib/escrow.ts (5% card / 0% cash, locked at order creation — ruling
// 2026-11-23). This backend never computes commission and never moves money.
// AUTO-PAYOUT IS OFF: no escrow→bank transfer code may live here.

// Gas Points: 1 GP = N1, spendable only inside the app (max 10% of an order).
const REFERRAL_GP = 300;

// October launch promo: order 5kg or more, get 500 GP (in-app gas credit).
const PROMO_MIN_KG = 5;
const PROMO_GP = 500;
const PROMO_END = new Date('2026-11-01T00:00:00+01:00'); // ends midnight Oct 31 WAT

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

// The ONLY SMS sender in the Firebase backend. One helper, one sender ID,
// one channel. Transactional traffic uses 'generic' with the approved "OGas" ID.
async function sendSMS(to, message) {
  if (!TERMII_API_KEY) { console.log('SMS skipped: no Termii key'); return; }
  if (!to) { console.log('SMS skipped: no phone'); return; }
  try {
    const cleanTo = String(to).replace(/^\+?234/, '234').replace(/^0/, '234');
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

// ═══════════════════════════════════════════════════════════════
// PAYMENTS (unchanged)
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
// ORDER STATUS SMS + PUSH — the single owner of buyer status messages.
// (Merged 2026-11-23: absorbs the old onOrderStatusChanged +
// notifyOnOrderChange duplicates. New-order and paid alerts are sent by the
// Next.js routes — create-order for cash, webhook/notifyPaidEscrow for card.)
// ═══════════════════════════════════════════════════════════════

exports.onOrderStatusChanged = onDocumentUpdated(
  { document: 'orders/{orderId}', region: 'europe-west3' },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (before.status === after.status) return;

    const { status, buyerPhone, sellerPhone, buyerId, sellerName } = after;
    const orderId = event.params.orderId;
    const shortId = orderId.slice(-6).toUpperCase();
    // Weighed on the seller's scale via Weigh & Fill — the number the buyer
    // paid for, stated plainly (OGas positioning: weight on every delivery).
    const weighedKg = Number(after.kgDelivered || after.kgAmount || after.kg || 0);

    switch (status) {
      case 'confirmed':
        if (buyerPhone) {
          await sendSMS(buyerPhone, `OGas order ${shortId}: ${sellerName || 'your seller'} confirmed. Your gas is being prepared.`);
        }
        await sendPush(buyerId, 'Order Confirmed', `${sellerName || 'Seller'} confirmed your order.`, { orderId, type: 'confirmed' });
        break;

      case 'out_for_delivery':
        if (buyerPhone) {
          await sendSMS(buyerPhone, `OGas order ${shortId} is on the way. Have your Door Code ready.`);
        }
        await sendPush(buyerId, 'Out for Delivery', 'Your gas is on the way!', { orderId, type: 'out_for_delivery' });
        break;

      case 'delivered':
        if (buyerPhone) {
          await sendSMS(
            buyerPhone,
            weighedKg > 0
              ? `OGas order ${shortId} delivered — weighed ${weighedKg}kg on the scale. Confirm in the app to release payment.`
              : `OGas order ${shortId} marked delivered. Confirm in the app to release payment.`,
          );
        }
        await sendPush(buyerId, 'Confirm Delivery', 'Your gas was delivered. Confirm to release payment.', { orderId, type: 'delivered' });
        if (sellerPhone) {
          await sendSMS(sellerPhone, `OGas order ${shortId} delivered. Waiting for buyer confirmation.`);
        }
        break;

      // 'completed' notifications are sent by the escrow release path
      // (lib/escrow.ts) — nothing here, so nobody gets two SMS.
    }
  });

// ═══════════════════════════════════════════════════════════════
// FCM TOKEN REGISTRATION
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
// AUTO-COMPLETE ORDERS
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

// ===== GAS CREDIT: 300 credit on FIRST completed order (every buyer) =====
// Budget-guarded by promoConfig/gasCreditCampaign (Firestore doc YOU create).
// Exactly-once: claim + budget + credit all inside one transaction.
const FIRST_ORDER_CREDIT = 300;

// ORCHESTRATION: order expiry + paystack reconciliation + day-end balance

const EXPIRY_MINUTES = 30;

async function settlePaidOrder(db, orderRef, order, orderId, reference, paidKobo) {
  await orderRef.update({
    status: 'paid', paymentStatus: 'paid', escrowStatus: 'held',
    paystackRef: reference, paystackAmount: paidKobo,
    paidAt: new Date(), verifiedAt: new Date(), verifiedViaReconciliation: true,
    updatedAt: new Date(),
  });
  const pointsRedeemed = Math.max(0, Math.floor(Number(order.pointsRedeemed) || 0));
  if (pointsRedeemed > 0 && !order.pointsDeducted && order.buyerId) {
    const buyerRef = db.collection('users').doc(order.buyerId);
    const logRef = db.collection('pointsTransactions').doc();
    try {
      await db.runTransaction(async (tx) => {
        const [o, u] = await Promise.all([tx.get(orderRef), tx.get(buyerRef)]);
        if (o.data()?.pointsDeducted) return;
        const bal = Math.max(0, Math.floor(Number(u.data()?.gasPoints) || 0));
        const deduct = Math.min(pointsRedeemed, bal);
        tx.set(buyerRef, { gasPoints: bal - deduct }, { merge: true });
        tx.update(orderRef, { pointsDeducted: true, pointsDeductedCount: deduct });
        tx.set(logRef, { uid: order.buyerId, type: 'spend', points: deduct, reason: 'order_discount', orderId, createdAt: new Date() });
      });
    } catch (e) { console.error('recon points deduction failed:', e.message); }
  }
  const expectedNaira = Number(order.chargedAmount ?? order.totalAmount ?? order.total ?? 0);
  if (!order.pointsEarned && order.buyerId && expectedNaira > 0) {
    const buyerRef = db.collection('users').doc(order.buyerId);
    const logRef = db.collection('pointsTransactions').doc();
    try {
      await db.runTransaction(async (tx) => {
        const o = await tx.get(orderRef);
        if (o.data()?.pointsEarned) return;
        const earn = Math.min(500, Math.floor(expectedNaira * 0.02));
        tx.update(orderRef, { pointsEarned: true, pointsEarnedCount: earn });
        if (earn <= 0) return;
        const u = await tx.get(buyerRef);
        const bal = Math.max(0, Math.floor(Number(u.data()?.gasPoints) || 0));
        tx.set(buyerRef, { gasPoints: bal + earn }, { merge: true });
        tx.set(logRef, { uid: order.buyerId, type: 'earn', points: earn, reason: 'order_cashback', orderId, createdAt: new Date() });
      });
    } catch (e) { console.error('recon GasBack failed:', e.message); }
  }
}

// A) Expire unpaid ONLINE orders (checkout started, never completed).
//    Cash orders (pending_cash / paymentMethod cash / no paystackRef) are NEVER touched.
exports.expireUnpaidOrders = onSchedule('every 10 minutes', async () => {
  const db = admin.firestore();
  const cutoff = Date.now() - EXPIRY_MINUTES * 60 * 1000;
  const snap = await db.collection('orders').where('paymentStatus', '==', 'pending').get();
  const batch = db.batch();
  let n = 0;
  snap.forEach((d) => {
    const o = d.data();
    if (!o.paystackRef) return;
    if (o.paymentMethod === 'cash' || o.status === 'pending_cash') return;
    const ts = o.updatedAt?.toMillis ? o.updatedAt.toMillis() : new Date(o.updatedAt || 0).getTime();
    if (ts >= cutoff) return;
    batch.update(d.ref, { status: 'cancelled', paymentStatus: 'expired',
      cancelledAt: new Date(), expiredReason: 'payment_timeout', updatedAt: new Date() });
    n++;
  });
  if (n) { await batch.commit(); console.log('expired unpaid orders:', n); }
});

// B) Reconcile: check every pending online order against Paystack reality.
exports.reconcilePayments = onSchedule('every 30 minutes', async () => {
  if (!PAYSTACK_SECRET) return;
  const db = admin.firestore();
  const grace = Date.now() - 10 * 60 * 1000; // let the webhook win first
  const snap = await db.collection('orders').where('paymentStatus', '==', 'pending').get();
  for (const d of snap.docs) {
    const o = d.data();
    if (!o.paystackRef || o.paymentMethod === 'cash' || o.status === 'pending_cash') continue;
    const ts = o.updatedAt?.toMillis ? o.updatedAt.toMillis() : new Date(o.updatedAt || 0).getTime();
    if (ts >= grace) continue;
    try {
      const r = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(o.paystackRef),
        { headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET } });
      const v = await r.json();
      const ps = v.data?.status;
      if (ps === 'success') {
        const paidKobo = Number(v.data.amount);
        const expected = Math.round(Number(o.chargedAmount ?? o.totalAmount ?? o.total ?? 0) * 100);
        if (expected > 0 && Math.abs(paidKobo - expected) > 100) {
          console.error('recon amount mismatch', d.id); continue;
        }
        await settlePaidOrder(db, d.ref, o, d.id, o.paystackRef, paidKobo);
        if (o.buyerPhone) await sendSMS(o.buyerPhone, 'OGas: your payment don confirm. Your order is now active.');
        console.log('recon settled paid:', d.id);
      } else if (ps === 'abandoned' || ps === 'failed') {
        await d.ref.update({ status: 'cancelled', paymentStatus: ps,
          cancelledAt: new Date(), expiredReason: 'paystack_' + ps, updatedAt: new Date() });
        console.log('recon cancelled ' + ps + ':', d.id);
      }
    } catch (e) { console.error('recon error', d.id, e.message); }
  }
});

// C) Day-end balance (23:55 Lagos) -> dailyReports/YYYY-MM-DD. balanced=false flags gaps.
// Updated 2026-11-23 for pay-on-collection: reads commission/sellerEarnings.
exports.dayEndBalance = onSchedule({ schedule: '55 23 * * *', timeZone: 'Africa/Lagos' }, async () => {
  const db = admin.firestore();
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const day = start.toISOString().slice(0, 10);
  const orders = await db.collection('orders').where('updatedAt', '>=', start).get();
  let completedCount = 0, completedSum = 0, expectedPayout = 0, commissionSum = 0, abandoned = 0, expired = 0, paidCount = 0, paidSum = 0;
  orders.forEach((d) => {
    const o = d.data();
    const amt = Number(o.totalAmount ?? o.total ?? o.chargedAmount ?? 0);
    if (o.paymentStatus === 'paid') { paidCount++; paidSum += amt; }
    if (o.paymentStatus === 'abandoned' || o.paymentStatus === 'failed') abandoned++;
    if (o.paymentStatus === 'expired') expired++;
    if (o.status === 'completed') {
      completedCount++; completedSum += amt;
      expectedPayout += Number(o.sellerEarnings || 0);
      commissionSum += Number(o.commission ?? o.ogasCommission ?? 0);
    }
  });
  const report = { day, paidCount, paidSum, completedCount, completedSum, abandoned, expired,
    commissionSum, expectedPayout, payoutModel: 'pay_on_collection',
    checkedAt: admin.firestore.FieldValue.serverTimestamp() };
  await db.collection('dailyReports').doc(day).set(report);
  console.log('day-end ' + day + ':', JSON.stringify(report));
});

exports.onFirstOrderGasCredit = onDocumentUpdated(
  { document: "orders/{orderId}", region: "europe-west3" },
  async (event) => {
    const before = event.data && event.data.before ? event.data.before.data() : null;
    const after = event.data && event.data.after ? event.data.after.data() : null;
    if (!after || !before) return;
    if (after.status !== 'completed' || before.status === 'completed') return;

    const buyerId = after.buyerId;
    if (!buyerId) return; // walk-in orders with phone-only stay out (phase 2)

    const db = admin.firestore();
    const orderId = event.params.orderId;
    const CREDIT = FIRST_ORDER_CREDIT;

    try {
      await db.runTransaction(async (tx) => {
        const campaignRef = db.collection('promoConfig').doc('gasCreditCampaign');
        const claimRef = db.collection('welcomeCredits').doc(buyerId);
        const userRef = db.collection('users').doc(buyerId);
        const [campaign, claim] = await Promise.all([tx.get(campaignRef), tx.get(claimRef)]);

        if (!campaign.exists || campaign.data().active !== true) throw new Error('campaign_inactive');
        if (claim.exists) throw new Error('already_credited');

        const remaining = Number(campaign.data().remainingBudget ?? 0);
        if (remaining < CREDIT) throw new Error('budget_exhausted');

        tx.set(campaignRef, {
          remainingBudget: remaining - CREDIT,
          totalIssued: admin.firestore.FieldValue.increment(CREDIT),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        tx.set(claimRef, {
          buyerId, orderId, amount: CREDIT, status: 'issued',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.set(userRef, {
          gasPoints: admin.firestore.FieldValue.increment(CREDIT),
        }, { merge: true });
        tx.set(db.collection('pointsTransactions').doc(), {
          uid: buyerId, type: 'earn', points: CREDIT,
          reason: 'first_order', orderId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    } catch (e) {
      if (e.message === 'already_credited' || e.message === 'campaign_inactive' || e.message === 'budget_exhausted') {
        console.log('Gas credit skipped:', e.message, buyerId);
      } else {
        console.error('Gas credit error:', e);
      }
      return;
    }

    try {
      await sendPush(buyerId, 'Gas Credit Earned!', 'Your first order earned you 300 gas credit. Use it on your next order.', { type: 'gas_credit', orderId });
      if (after.buyerPhone) {
        await sendSMS(after.buyerPhone, 'OGas: 300 gas credit don enter your tank from your first order. Use am for your next gas. ogaslpgmarketplace.com');
      }
    } catch (e) { console.error('Notify error:', e); }
    console.log('Welcome gas credit: ' + buyerId + ' +' + CREDIT + ' (order ' + orderId + ')');
  });

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
