const {onRequest, onCall, HttpsError} = require('firebase-functions/v2/https');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// === PAYSTACK WEBHOOK ===
exports.paystackWebhook = onRequest(async (req, res) => {
  const event = req.body;
  if (event.event === 'charge.success') {
    const { reference, metadata } = event.data;
    const orderId = metadata && metadata.orderId;
    if (!orderId) return res.sendStatus(200);
    const orderRef = db.collection('orders').doc(orderId);
    await db.runTransaction(async (t) => {
      const snap = await t.get(orderRef);
      if (!snap.exists) return;
      const data = snap.data();
      if (data.paymentStatus === 'paid') return;
      t.update(orderRef, {
        paymentStatus: 'paid',
        status: 'confirmed',
        paystackReference: reference,
        paidAt: new Date(),
      });
      t.set(db.collection('escrows').doc(orderId), {
        orderId: orderId,
        sellerId: data.sellerId,
        amount: data.totalAmount,
        platformFee: Math.round(data.totalAmount * 0.10 * 100) / 100,
        sellerPayout: Math.round(data.totalAmount * 0.90 * 100) / 100,
        status: 'held',
        createdAt: new Date(),
      });
    });
  }
  res.sendStatus(200);
});

// === RELEASE ESCROW ===
exports.releaseEscrow = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  const { orderId } = request.data;
  const orderRef = db.collection('orders').doc(orderId);
  const escrowRef = db.collection('escrows').doc(orderId);
  return db.runTransaction(async (t) => {
    const orderSnap = await t.get(orderRef);
    const escrowSnap = await t.get(escrowRef);
    if (!orderSnap.exists || !escrowSnap.exists) throw new HttpsError('not-found', 'Order not found');
    const order = orderSnap.data();
    if (order.buyerId !== request.auth.uid) throw new HttpsError('permission-denied', 'Only buyer can confirm');
    if (order.status !== 'out_for_delivery') throw new HttpsError('failed-precondition', 'Order not delivered yet');
    t.update(orderRef, { status: 'delivered', updatedAt: new Date() });
    t.update(escrowRef, { status: 'released', releasedAt: new Date() });
    t.set(db.collection('payouts').doc(), {
      sellerId: order.sellerId,
      amount: escrowSnap.data().sellerPayout,
      orderId: orderId,
      status: 'pending',
      createdAt: new Date(),
    });
    return { success: true };
  });
});

// === PROCESS PAYOUTS (Monday 9AM WAT) ===
exports.processPayouts = onSchedule({
  schedule: '0 9 * * 1',
  timeZone: 'Africa/Lagos',
}, async () => {
  const pending = await db.collection('payouts').where('status', '==', 'pending').limit(100).get();
  const batch = db.batch();
  for (const doc of pending.docs) {
    batch.update(doc.ref, { status: 'processing', processedAt: new Date() });
  }
  await batch.commit();
  return null;
});

// === AUTO-CANCEL UNPAID ORDERS ===
exports.autoCancelOrders = onSchedule({
  schedule: 'every 10 minutes',
}, async () => {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const stale = await db.collection('orders').where('status', '==', 'pending').where('createdAt', '<', cutoff).get();
  const batch = db.batch();
  stale.forEach(d => batch.update(d.ref, { status: 'cancelled', updatedAt: new Date() }));
  await batch.commit();
  return null;
});

// === SELLER VERIFICATION ===
exports.verifySeller = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  const { sellerId } = request.data;
  const adminDoc = await db.collection('admins').doc(request.auth.uid).get();
  if (!adminDoc.exists) throw new HttpsError('permission-denied', 'Admin only');
  await db.collection('sellers').doc(sellerId).update({
    isVerified: true,
    verifiedAt: new Date(),
    verifiedBy: request.auth.uid,
  });
  return { success: true };
});
