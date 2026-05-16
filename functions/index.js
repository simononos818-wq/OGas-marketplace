const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { beforeUserCreated } = require('firebase-functions/v2/identity');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');
const axios = require('axios');

admin.initializeApp();

// ============ SECRETS ============
const paystackSecret = defineSecret('PAYSTACK_SECRET');

// ============ CORS HELPER ============
const setCors = (res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// ============ PAYSTACK SIGNATURE VERIFY ============
function verifyPaystackSignature(body, signature, secret) {
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
  return hash === signature;
}

// ============ UID COUNTER ============
const getNextUID = async () => {
  const counterRef = admin.firestore().collection('system').doc('counters');
  return admin.firestore().runTransaction(async (t) => {
    const doc = await t.get(counterRef);
    const current = doc.exists ? (doc.data().userCount || 0) : 0;
    t.set(counterRef, { userCount: current + 1 }, { merge: true });
    return current + 1;
  });
};

// ============ 1. UID ASSIGNMENT ON USER CREATE ============
exports.assignUserUID = beforeUserCreated(async (event) => {
  const user = event.data;
  const { uid: authUid, email, phoneNumber, displayName } = user;
  
  try {
    const num = await getNextUID();
    const ogasUID = `OG-${num.toString().padStart(6, '0')}`;
    
    const userData = {
      authUid,
      ogasUID,
      userType: 'B',
      email: email || '',
      phoneNumber: phoneNumber || '',
      displayName: displayName || 'OGas User',
      status: 'active',
      verificationStatus: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      rating: 0,
      totalOrders: 0,
      disputeCount: 0
    };
    
    await admin.firestore().collection('users').doc(authUid).set(userData);
    await admin.auth().setCustomUserClaims(authUid, { ogasUID, userType: 'B' });
    
    console.log(`✅ UID assigned: ${ogasUID} to ${authUid}`);
    return { success: true, ogasUID };
    
  } catch (error) {
    console.error('❌ UID assignment failed:', error);
    throw error;
  }
});

// ============ 2. CREATE ORDER ============
exports.createOrder = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  
  const { sellerId, quantity, deliveryAddress, deliveryCoordinates, gasCost, deliveryFee, totalAmount } = request.data;
  const buyerId = request.auth.uid;
  
  const buyerDoc = await admin.firestore().collection('users').doc(buyerId).get();
  if (!buyerDoc.exists) throw new HttpsError('not-found', 'Buyer not found');
  const buyerData = buyerDoc.data();
  
  const sellerDoc = await admin.firestore().collection('users').doc(sellerId).get();
  if (!sellerDoc.exists) throw new HttpsError('not-found', 'Seller not found');
  const sellerData = sellerDoc.data();
  
  if (sellerData.status !== 'active' || sellerData.verificationStatus !== 'verified') {
    throw new HttpsError('failed-precondition', 'Seller not available');
  }
  
  const orderRef = admin.firestore().collection('orders').doc();
  const orderId = orderRef.id;
  
  await orderRef.set({
    orderId,
    status: 'pending',
    paymentStatus: 'pending',
    buyerId,
    buyerUID: buyerData.ogasUID,
    buyerName: buyerData.displayName,
    buyerPhone: buyerData.phoneNumber,
    sellerId,
    sellerUID: sellerData.ogasUID,
    sellerName: sellerData.displayName || sellerData.businessName,
    sellerPhone: sellerData.phoneNumber,
    sellerLocation: sellerData.location || null,
    quantity,
    gasCost,
    deliveryFee,
    serviceFee: Math.round(gasCost * 0.05),
    totalAmount,
    deliveryAddress,
    deliveryCoordinates: deliveryCoordinates || null,
    estimatedDelivery: '30-60 mins',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    acceptedAt: null,
    dispatchedAt: null,
    deliveredAt: null,
    confirmedAt: null,
    trackingUpdates: [{
      status: 'pending',
      note: 'Order placed, awaiting seller',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }],
    paystackReference: null,
    escrowReleased: false,
    disputeId: null,
    buyerRating: null,
    sellerRating: null
  });
  
  console.log(`📱 SMS to seller ${sellerData.phoneNumber}: New order #${orderId.slice(-6)}`);
  setTimeout(async () => { await checkOrderTimeout(orderId); }, 10 * 60 * 1000);
  
  return { success: true, orderId, message: 'Order placed. Seller notified.' };
});

// ============ 3. SELLER ACCEPT ORDER ============
exports.sellerAcceptOrder = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  
  const { orderId } = request.data;
  const sellerId = request.auth.uid;
  
  const orderRef = admin.firestore().collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  
  if (!orderDoc.exists || orderDoc.data().sellerId !== sellerId) {
    throw new HttpsError('permission-denied', 'Not your order');
  }
  if (orderDoc.data().status !== 'pending') {
    throw new HttpsError('failed-precondition', 'Order unavailable');
  }
  
  await orderRef.update({
    status: 'accepted',
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    'trackingUpdates': admin.firestore.FieldValue.arrayUnion({
      status: 'accepted',
      note: 'Seller accepted order',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    })
  });
  
  await admin.firestore().collection('users').doc(sellerId).update({
    activeOrders: admin.firestore.FieldValue.increment(1),
    totalOrders: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  const orderData = orderDoc.data();
  const buyerData = (await admin.firestore().collection('users').doc(orderData.buyerId).get()).data();
  console.log(`📱 SMS to buyer ${buyerData.phoneNumber}: Order accepted, please pay`);
  
  return { success: true, message: 'Order accepted. Awaiting buyer payment.' };
});

// ============ 4. SELLER DECLINE ORDER ============
exports.sellerDeclineOrder = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  
  const { orderId, reason } = request.data;
  const sellerId = request.auth.uid;
  
  const orderRef = admin.firestore().collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  
  if (!orderDoc.exists || orderDoc.data().sellerId !== sellerId) {
    throw new HttpsError('permission-denied', 'Not your order');
  }
  
  await orderRef.update({
    status: 'declined',
    declineReason: reason || 'Unavailable',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    'trackingUpdates': admin.firestore.FieldValue.arrayUnion({
      status: 'declined',
      note: `Seller declined: ${reason || 'Unavailable'}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    })
  });
  
  return { success: true, message: 'Order declined.' };
});

// ============ 5. INITIALIZE PAYMENT ============
exports.initializePayment = onCall(
  { secrets: [paystackSecret] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    
    const { orderId } = request.data;
    const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
    if (!orderDoc.exists) throw new HttpsError('not-found', 'Order not found');
    
    const orderData = orderDoc.data();
    if (orderData.buyerId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Not your order');
    }
    if (orderData.status !== 'accepted') {
      throw new HttpsError('failed-precondition', 'Order not yet accepted');
    }
    
    const buyerData = (await admin.firestore().collection('users').doc(orderData.buyerId).get()).data();
    const PAYSTACK_SECRET = paystackSecret.value();
    
    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: buyerData.email,
          amount: orderData.totalAmount * 100,
          reference: `OGAS-${orderId}-${Date.now()}`,
          callback_url: `https://ogas.ng/payment/callback?order=${orderId}`,
          metadata: { orderId, buyerId: orderData.buyerId, sellerId: orderData.sellerId }
        },
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' } }
      );
      
      await orderDoc.ref.update({
        paystackReference: response.data.data.reference,
        paymentStatus: 'pending',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference
      };
      
    } catch (error) {
      console.error('Paystack init error:', error.response?.data || error.message);
      throw new HttpsError('internal', 'Payment initialization failed');
    }
  }
);

// ============ 6. SELLER DISPATCH ORDER ============
exports.sellerDispatchOrder = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  
  const { orderId } = request.data;
  const sellerId = request.auth.uid;
  
  const orderRef = admin.firestore().collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  
  if (!orderDoc.exists || orderDoc.data().sellerId !== sellerId) {
    throw new HttpsError('permission-denied', 'Not your order');
  }
  if (orderDoc.data().status !== 'paid') {
    throw new HttpsError('failed-precondition', 'Payment not confirmed');
  }
  
  await orderRef.update({
    status: 'dispatched',
    dispatchedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    'trackingUpdates': admin.firestore.FieldValue.arrayUnion({
      status: 'dispatched',
      note: 'Seller dispatched order',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    })
  });
  
  const orderData = orderDoc.data();
  const buyerData = (await admin.firestore().collection('users').doc(orderData.buyerId).get()).data();
  console.log(`📱 SMS to buyer ${buyerData.phoneNumber}: Order dispatched`);
  
  return { success: true, message: 'Order dispatched. Buyer notified.' };
});

// ============ 7. SELLER MARK DELIVERED ============
exports.sellerMarkDelivered = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  
  const { orderId, deliveryPhoto } = request.data;
  const sellerId = request.auth.uid;
  
  const orderRef = admin.firestore().collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  
  if (!orderDoc.exists || orderDoc.data().sellerId !== sellerId) {
    throw new HttpsError('permission-denied', 'Not your order');
  }
  
  await orderRef.update({
    status: 'delivered',
    deliveryPhoto: deliveryPhoto || null,
    deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    'trackingUpdates': admin.firestore.FieldValue.arrayUnion({
      status: 'delivered',
      note: 'Seller marked as delivered',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    })
  });
  
  const orderData = orderDoc.data();
  const buyerData = (await admin.firestore().collection('users').doc(orderData.buyerId).get()).data();
  console.log(`📱 SMS to buyer ${buyerData.phoneNumber}: Please confirm delivery`);
  
  return { success: true, message: 'Marked delivered. Awaiting buyer confirmation.' };
});

// ============ 8. BUYER CONFIRM DELIVERY ============
exports.buyerConfirmDelivery = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  
  const { orderId, rating, review } = request.data;
  const buyerId = request.auth.uid;
  
  const orderRef = admin.firestore().collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  
  if (!orderDoc.exists || orderDoc.data().buyerId !== buyerId) {
    throw new HttpsError('permission-denied', 'Not your order');
  }
  if (orderDoc.data().status !== 'delivered') {
    throw new HttpsError('failed-precondition', 'Not yet delivered');
  }
  
  const orderData = orderDoc.data();
  
  await orderRef.update({
    status: 'completed',
    confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    buyerRating: rating || null,
    buyerReview: review || null,
    paymentStatus: 'ready_for_payout',
    escrowReleased: true
  });
  
  await admin.firestore().collection('users').doc(orderData.sellerId).update({
    activeOrders: admin.firestore.FieldValue.increment(-1),
    completedOrders: admin.firestore.FieldValue.increment(1),
    rating: admin.firestore.FieldValue.increment(rating || 5),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log(`📱 SMS to seller ${orderData.sellerPhone}: Order complete, payout pending`);
  
  return { success: true, message: 'Delivery confirmed. Seller will be paid.' };
});

// ============ 9. BUYER OPEN DISPUTE ============
exports.createDispute = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  
  const { orderId, reason, description } = request.data;
  const buyerId = request.auth.uid;
  
  const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
  if (!orderDoc.exists || orderDoc.data().buyerId !== buyerId) {
    throw new HttpsError('permission-denied', 'Not your order');
  }
  
  const orderData = orderDoc.data();
  const buyerData = (await admin.firestore().collection('users').doc(buyerId).get()).data();
  const sellerData = (await admin.firestore().collection('users').doc(orderData.sellerId).get()).data();
  
  const disputeRef = admin.firestore().collection('disputes').doc();
  
  await disputeRef.set({
    disputeId: disputeRef.id,
    orderId,
    status: 'open',
    priority: 'medium',
    complainant: {
      userId: buyerId,
      ogasUID: buyerData.ogasUID,
      name: buyerData.displayName,
      phone: buyerData.phoneNumber,
      email: buyerData.email
    },
    respondent: {
      userId: orderData.sellerId,
      ogasUID: sellerData.ogasUID,
      name: sellerData.displayName || sellerData.businessName,
      phone: sellerData.phoneNumber,
      email: sellerData.email
    },
    reason,
    description,
    evidence: [],
    requestedResolution: null,
    resolution: null,
    escrowHold: true,
    escrowAmount: orderData.totalAmount,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  await orderDoc.ref.update({
    disputeId: disputeRef.id,
    disputeStatus: 'open',
    status: 'disputed'
  });
  
  console.log(`🚨 DISPUTE: ${disputeRef.id} — Buyer ${buyerData.ogasUID} vs Seller ${sellerData.ogasUID}`);
  
  return {
    success: true,
    disputeId: disputeRef.id,
    message: 'Dispute opened. Admin will review within 24 hours. Escrow frozen.'
  };
});

// ============ 10. ADMIN RESOLVE DISPUTE ============
exports.resolveDispute = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  
  const adminDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().userType !== 'A') {
    throw new HttpsError('permission-denied', 'Admin only');
  }
  
  const { disputeId, decision, refundAmount, notes } = request.data;
  
  const disputeRef = admin.firestore().collection('disputes').doc(disputeId);
  const disputeDoc = await disputeRef.get();
  
  if (!disputeDoc.exists) throw new HttpsError('not-found', 'Dispute not found');
  
  const disputeData = disputeDoc.data();
  const adminData = adminDoc.data();
  
  await disputeRef.update({
    status: 'resolved',
    resolution: {
      decision,
      refundAmount: refundAmount || 0,
      notes,
      resolvedBy: {
        adminId: request.auth.uid,
        ogasUID: adminData.ogasUID,
        name: adminData.displayName
      },
      resolvedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  const orderRef = admin.firestore().collection('orders').doc(disputeData.orderId);
  
  if (decision === 'buyer_favor') {
    await orderRef.update({ status: 'disputed_refunded', refundAmount: refundAmount || disputeData.escrowAmount, paymentStatus: 'refunded' });
  } else if (decision === 'seller_favor') {
    await orderRef.update({ status: 'disputed_seller_wins', paymentStatus: 'ready_for_payout' });
  }
  
  return { success: true, message: 'Dispute resolved.' };
});

// ============ 11. GET USER BY UID ============
exports.getUserByUID = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  
  const { ogasUID } = request.data;
  
  const userQuery = await admin.firestore()
    .collection('users')
    .where('ogasUID', '==', ogasUID)
    .limit(1)
    .get();
  
  if (userQuery.empty) throw new HttpsError('not-found', 'User not found');
  
  const userData = userQuery.docs[0].data();
  const isAdmin = userData.userType === 'A';
  
  return {
    ogasUID: userData.ogasUID,
    userType: userData.userType,
    displayName: userData.displayName,
    status: userData.status,
    verificationStatus: userData.verificationStatus,
    rating: userData.rating,
    totalOrders: userData.totalOrders,
    disputeCount: userData.disputeCount,
    createdAt: userData.createdAt?.toDate()?.toISOString(),
    ...(isAdmin ? { email: userData.email, phoneNumber: userData.phoneNumber } : {})
  };
});

// ============ 12. YOUR EXISTING PAYMENT FUNCTIONS ============
exports.paymentVerify = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  
  const reference = req.query.reference;
  if (!reference) return res.status(400).json({ error: 'Reference required' });
  
  try {
    const response = await axios.get(
      'https://api.paystack.co/transaction/verify/' + reference,
      { headers: { Authorization: 'Bearer ' + paystackSecret.value() } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Payment verify error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

exports.paymentWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  
  const signature = req.headers['x-paystack-signature'];
  const rawBody = JSON.stringify(req.body);
  
  if (!verifyPaystackSignature(rawBody, signature, paystackSecret.value())) {
    console.error('Invalid webhook signature');
    return res.status(401).send('Unauthorized');
  }
  
  const event = req.body;
  
  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    const amount = event.data.amount / 100;
    
    const ordersRef = admin.firestore().collection('orders');
    const snapshot = await ordersRef.where('paystackReference', '==', reference).limit(1).get();
    
    if (snapshot.empty) {
      console.error('Order not found for reference:', reference);
      return res.status(200).send('OK');
    }
    
    const orderDoc = snapshot.docs[0];
    await orderDoc.ref.update({
      status: 'paid',
      paymentStatus: 'escrow_held',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      amountPaid: amount,
      paystackTransactionId: event.data.id,
      'trackingUpdates': admin.firestore.FieldValue.arrayUnion({
        status: 'paid',
        note: 'Payment received, held in escrow',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      })
    });
    
    const orderData = orderDoc.data();
    console.log(`📱 SMS to seller ${orderData.sellerPhone}: Payment received, start delivery`);
    console.log('Payment confirmed for order:', orderDoc.id);
  }
  
  res.status(200).send('OK');
});

exports.resolveBank = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  
  const { account_number, bank_code } = req.query;
  if (!account_number || !bank_code) {
    return res.status(400).json({ error: 'Account number and bank code required' });
  }
  
  try {
    const response = await axios.get(
      'https://api.paystack.co/bank/resolve?account_number=' + account_number + '&bank_code=' + bank_code,
      { headers: { Authorization: 'Bearer ' + paystackSecret.value() } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Bank resolve error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============ HELPERS ============

async function checkOrderTimeout(orderId) {
  const orderRef = admin.firestore().collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  
  if (!orderDoc.exists) return;
  
  const orderData = orderDoc.data();
  if (orderData.status !== 'pending') return;
  
  await orderRef.update({
    status: 'expired',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    'trackingUpdates': admin.firestore.FieldValue.arrayUnion({
      status: 'expired',
      note: 'No seller response in 10 minutes',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    })
  });
  
  const buyerData = (await admin.firestore().collection('users').doc(orderData.buyerId).get()).data();
  console.log(`📱 SMS to buyer ${buyerData.phoneNumber}: Order expired, refund pending`);
  
  if (orderData.paymentStatus === 'escrow_held') {
    console.log(`💰 Auto-refund for expired order ${orderId}`);
  }
}
