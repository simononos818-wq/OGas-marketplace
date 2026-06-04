const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const db = admin.apps.length ? admin.firestore() : (admin.initializeApp(), admin.firestore());

exports.getMessages = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
      }

      const { chatId } = req.query;
      if (!chatId) {
        return res.status(400).json({ error: 'Missing chatId' });
      }

      const snap = await db.collection('messages')
        .where('chatId', '==', chatId)
        .orderBy('createdAt', 'asc')
        .limit(100)
        .get();

      const messages = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      }));

      res.json({ success: true, count: messages.length, messages });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
