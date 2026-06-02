const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const db = admin.apps.length ? admin.firestore() : (admin.initializeApp(), admin.firestore());

exports.getVendors = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    try {
      const snap = await db.collection('vendors').get();
      const vendors = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      res.json({ success: true, count: vendors.length, vendors });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
