const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
admin.initializeApp();
const axios = require('axios');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
if (!PAYSTACK_SECRET) {
  console.error('ERROR: PAYSTACK_SECRET environment variable is not set!');
}

const setCors = (res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Verify Paystack webhook signature
function verifyPaystackSignature(body, signature, secret) {
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
  return hash === signature;
}

exports.paymentVerify = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  
  const reference = req.query.reference;
  if (!reference) return res.status(400).json({ error: 'Reference required' });
  
  try {
    const response = await axios.get(
      'https://api.paystack.co/transaction/verify/' + reference,
      { headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Payment verify error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  
  // Verify signature
  const signature = req.headers['x-paystack-signature'];
  const rawBody = JSON.stringify(req.body);
  
  if (!verifyPaystackSignature(rawBody, signature, PAYSTACK_SECRET)) {
    console.error('Invalid webhook signature');
    return res.status(401).send('Unauthorized');
  }
  
  const event = req.body;
  
  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    const amount = event.data.amount / 100; // Convert from kobo
    
    // Find order by reference (not document ID)
    const ordersRef = admin.firestore().collection('orders');
    const snapshot = await ordersRef.where('paymentReference', '==', reference).limit(1).get();
    
    if (snapshot.empty) {
      console.error('Order not found for reference:', reference);
      return res.status(200).send('OK'); // Still return 200 to Paystack
    }
    
    const orderDoc = snapshot.docs[0];
    await orderDoc.ref.update({
      status: 'paid',
      paymentStatus: 'success',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      amountPaid: amount,
      paystackTransactionId: event.data.id
    });
    
    console.log('Payment confirmed for order:', orderDoc.id);
  }
  
  res.status(200).send('OK');
});

exports.resolveBank = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  
  const { account_number, bank_code } = req.query;
  if (!account_number || !bank_code) {
    return res.status(400).json({ error: 'Account number and bank code required' });
  }
  
  try {
    const response = await axios.get(
      'https://api.paystack.co/bank/resolve?account_number=' + account_number + '&bank_code=' + bank_code,
      { headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Bank resolve error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
