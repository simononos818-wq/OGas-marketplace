const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

exports.fixSellers = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    try {
      const sellersSnap = await db.collection('sellers').get();
      let fixed = 0;
      let deactivated = 0;

      for (const doc of sellersSnap.docs) {
        const data = doc.data();
        const updates = {};

        // Deactivate mock sellers
        if (data.isMock === true) {
          updates.isAvailable = false;
          updates.isVerified = false;
          deactivated++;
        } else {
          // Real sellers - verify and activate
          updates.isVerified = true;
          updates.isAvailable = true;
          
          // Fix missing fields
          if (!data.gasSizes && data.prices) {
            updates.gasSizes = Object.keys(data.prices);
          }
          if (!data.deliveryFee) {
            updates.deliveryFee = 500;
          }
          if (!data.hasDelivery && data.hasDelivery !== false) {
            updates.hasDelivery = true;
          }
          if (!data.totalOrders && data.totalOrders !== 0) {
            updates.totalOrders = 0;
          }
          fixed++;
        }

        await doc.ref.update(updates);
      }

      res.json({ 
        success: true, 
        message: `Fixed ${fixed} real sellers, deactivated ${deactivated} mock sellers`,
        fixed,
        deactivated
      });
    } catch (error) {
      console.error('Fix sellers error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
