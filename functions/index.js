const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp();
const db = getFirestore();

exports.createOrder = onRequest(
  { cors: true, region: 'us-central1' },
  async (req, res) => {
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

      await db.collection('sellers').doc(sellerId).update({
        totalOrders: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({
        success: true,
        message: 'Order placed successfully!',
        orderId: docRef.id,
      });

    } catch (error) {
      console.error('createOrder error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);
exports.saveSellerBankDetails = require("./saveSellerBankDetails").saveSellerBankDetails;
Object.assign(exports, require('./lib/index.js'));

// ================= PUSH NOTIFICATIONS (A–D build) =================
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');

async function sendPushToUser(uid, title, body, data) {
  if (!uid) return;
  try {
    const snap = await db.collection('userTokens').doc(uid).get();
    const tokens = (snap.data()?.tokens || []).slice(-5);
    if (!tokens.length) return;
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data || {},
      webpush: { notification: { icon: '/ogas-icon.svg', badge: '/ogas-icon.svg' } }
    });
  } catch (err) {
    console.error('push to', uid, 'failed:', err.message);
  }
}

exports.notifySellerOnNewOrder = onDocumentCreated('orders/{orderId}', async (event) => {
  const order = event.data?.data();
  if (!order) return;
  const first = (order.items || [])[0];
  const desc = first ? `${first.quantity}x ${first.kg ?? first.size}kg` : 'New order';
  await sendPushToUser(order.sellerId, '🔥 New gas order!', `${desc} — ₦${(order.total ?? order.totalAmount ?? 0).toLocaleString()}. Tap to accept.`, { orderId: event.params.orderId });
});

const BUYER_PUSH = {
  confirmed: ['✅ Order accepted', 'The seller confirmed your order. Gas is being prepared.'],
  out_for_delivery: ['🛵 Gas on the way', 'Your gas is out for delivery. Have your Door Code ready.'],
  delivered: ['✔️ Gas delivered', 'Enjoy! Tap to rate your seller.'],
  cancelled: ['Order cancelled', 'Your order was cancelled. Any payment is being refunded.']
};

exports.notifyBuyerOnStatusChange = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after || before.status === after.status) return;
  const msg = BUYER_PUSH[after.status];
  if (!msg) return;
  await sendPushToUser(after.buyerId ?? after.userId ?? after.buyerUid, msg[0], msg[1], { orderId: event.params.orderId });
});
