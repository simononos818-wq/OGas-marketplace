const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const db = admin.apps.length ? admin.firestore() : (admin.initializeApp(), admin.firestore());

exports.checkCollections = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    try {
      const vendorsSnap = await db.collection('vendors').get();
      const vendors = vendorsSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          // Explicitly show these critical fields
          hasBusinessName: !!data.businessName,
          hasPhone: !!data.phone,
          hasAddress: !!data.address,
          hasPrices: !!data.prices,
          hasGasSizes: !!data.gasSizes,
          pricesKeys: data.prices ? Object.keys(data.prices) : [],
          gasSizesArray: data.gasSizes || [],
        };
      });
      
      res.json({ vendorsCount: vendorsSnap.size, vendors: vendors });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
