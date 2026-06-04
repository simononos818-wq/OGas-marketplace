const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const db = admin.apps.length ? admin.firestore() : (admin.initializeApp(), admin.firestore());

exports.createOrder = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
      }

      const { buyerName, buyerPhone, buyerAddress, sellerId, sellerName, size, quantity, pricePerUnit, deliveryFee, total, paymentMethod, notes } = req.body;

      if (!buyerName || !buyerPhone || !sellerId || !size || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const orderData = {
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerAddress: buyerAddress || '',
        sellerId,
        sellerName: sellerName || '',
        size,
        quantity: Number(quantity),
        pricePerUnit: Number(pricePerUnit) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        total: Number(total) || 0,
        paymentMethod: paymentMethod || 'cash_on_delivery',
        notes: notes || '',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('orders').add(orderData);

      // Increment seller totalOrders
      await db.collection('vendors').doc(sellerId).update({
        totalOrders: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ 
        success: true, 
        message: 'Order placed successfully!',
        orderId: docRef.id 
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
