const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const db = admin.apps.length ? admin.firestore() : (admin.initializeApp(), admin.firestore());

exports.sendMessage = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
      }

      const { chatId, senderId, senderName, senderRole, text, orderId } = req.body;

      if (!chatId || !senderId || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const messageData = {
        chatId,
        senderId,
        senderName: senderName || 'User',
        senderRole: senderRole || 'buyer',
        text: text.trim(),
        orderId: orderId || null,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('messages').add(messageData);

      // Update chat metadata
      await db.collection('chats').doc(chatId).set({
        lastMessage: text.trim(),
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSenderId: senderId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      res.json({ success: true, messageId: docRef.id });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
