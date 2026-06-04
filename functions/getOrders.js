const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const db = admin.apps.length ? admin.firestore() : (admin.initializeApp(), admin.firestore());

exports.getOrders = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
      }

      const { phone, sellerId, status } = req.query;
      let query = db.collection('orders').orderBy('createdAt', 'desc');

      if (phone) {
        query = query.where('buyerPhone', '==', phone);
      }
      if (sellerId) {
        query = query.where('sellerId', '==', sellerId);
      }
      if (status) {
        query = query.where('status', '==', status);
      }

      const snap = await query.limit(50).get();
      const orders = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      }));

      res.json({ success: true, count: orders.length, orders });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
