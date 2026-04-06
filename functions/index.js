const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();
const PAYSTACK_SECRET = functions.config().paystack?.secret;

exports.verifyPaystackPayment = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      const { reference, vendorId, size, price } = req.body;
      const response = await axios.get("https://api.paystack.co/transaction/verify/" + reference, {
        headers: { Authorization: "Bearer " + PAYSTACK_SECRET }
      });
      if (response.data.data.status !== "success") return res.status(400).json({ error: "Payment failed" });
      const commission = Math.round(price * 0.05);
      const order = await db.collection("orders").add({
        reference, vendorId, size, price, commission,
        vendorEarnings: price - commission, status: "paid",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.json({ success: true, orderId: order.id, yourEarnings: commission });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  });
});
