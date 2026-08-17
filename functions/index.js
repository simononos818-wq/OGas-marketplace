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
