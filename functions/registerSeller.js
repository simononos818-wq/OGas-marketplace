const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const db = admin.apps.length ? admin.firestore() : (admin.initializeApp(), admin.firestore());

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

exports.registerSeller = onCall(
  { region: 'us-central1' },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to register as a seller.');
    }

    const { businessName, phone, address, state, lga, prices, gasSizes, hasDelivery, deliveryFee } = request.data;

    if (!businessName || !phone || !address) {
      throw new HttpsError('invalid-argument', 'Missing required fields: businessName, phone, address');
    }

    const baseSlug = slugify(businessName);
    let slug = baseSlug;
    // Ensure slug uniqueness by checking for collisions and appending part of the uid if needed
    const existing = await db.collection('sellers').where('slug', '==', slug).limit(1).get();
    if (!existing.empty && existing.docs[0].id !== auth.uid) {
      slug = `${baseSlug}-${auth.uid.slice(0, 5)}`;
    }

    const sellerData = {
      businessName: businessName.trim(),
      slug,
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
      uid: auth.uid,
    };

    // Use the seller's own auth UID as the document ID so Firestore rules
    // (allow write: if request.auth.uid == sellerId) let them edit their own listing.
    await db.collection('sellers').doc(auth.uid).set(sellerData, { merge: true });

    return {
      success: true,
      message: 'Seller registered successfully!',
      vendorId: auth.uid,
      slug,
    };
  }
);
