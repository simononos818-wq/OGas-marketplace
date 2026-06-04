const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const db = admin.apps.length ? admin.firestore() : (admin.initializeApp(), admin.firestore());

exports.updateOrderStatus = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
      }

      const { orderId, status } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({ error: 'Missing orderId or status' });
      }

      const validStatuses = ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      await db.collection('orders').doc(orderId).update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ success: true, message: `Order status updated to ${status}` });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
