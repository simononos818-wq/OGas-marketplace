const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const db = admin.apps.length ? admin.firestore() : (admin.initializeApp(), admin.firestore());

exports.registerSeller = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
      }

      const { businessName, phone, address, state, lga, prices, gasSizes, hasDelivery, deliveryFee, uid } = req.body;

      if (!businessName || !phone || !address) {
        return res.status(400).json({ error: 'Missing required fields: businessName, phone, address' });
      }

      const vendorData = {
        businessName: businessName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        state: state || 'Delta',
        lga: lga || 'Ughelli South',
        prices: prices || { '3': 1500, '5': 2500, '6': 3000, '12.5': 5500 },
        gasSizes: gasSizes || ['3', '5', '6', '12.5'],
        isVerified: true,
        isAvailable: true,
        isApproved: true,
        isOnline: true,
        hasDelivery: hasDelivery !== false,
        deliveryFee: deliveryFee || 500,
        rating: 5.0,
        reviewCount: 0,
        totalOrders: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        uid: uid || null,
      };

      const docRef = await db.collection('vendors').add(vendorData);

      res.json({ 
        success: true, 
        message: 'Seller registered successfully!',
        vendorId: docRef.id 
      });
    } catch (error) {
      console.error('Register seller error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
