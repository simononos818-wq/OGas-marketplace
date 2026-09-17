const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function seed() {
  const sellerId = 'eegoja-oil-gas-ltd';
  
  await db.collection('sellers').doc(sellerId).set({
    // Required for storefront display
    businessName: 'Eegoja Oil & Gas Ltd',
    brandName: 'Eegoja Oil & Gas',
    phone: '09052288367',
    email: 'care@eegojagas.com',
    address: 'KM 11 Ganaja–Ajaokuta Road, Lokoja, Kogi State',
    
    // Required for orders to work (create-order API checks these)
    pricePerKg: 304,        // ₦3800 / 12.5kg — adjust if your pricing is per-cylinder
    deliveryFee: 0,         // 0 for pickup-only, set 500+ if you offer delivery
    
    // Approval status — CRITICAL for storefront to show
    isApproved: true,
    sellerStatus: 'approved',
    verified: true,
    isActive: true,
    approvedAt: admin.firestore.Timestamp.fromDate(new Date()),
    
    // Rich data for the presentation
    capacityMT: 235,
    outletCount: 3,
    outlets: [
      { name: 'Ganaja Plant', address: 'KM 11 Ganaja–Ajaokuta Road, Lokoja', type: 'mother_plant' },
      { name: 'Felele', address: 'Opposite Kogi State Polytechnic, Lokoja', type: 'retail_station' },
      { name: 'Gadumo', address: 'Old Poly Quarters, Lokoja', type: 'retail_station' }
    ],
    prices: {
      '3kg': 1050,
      '5kg': 1650,
      '6kg': 1950,
      '12.5kg': 3800,
      '25kg': 7200,
      '50kg': 13800
    },
    
    // Stats
    totalOrders: 0,
    totalEarnings: 0,
    rating: 0,
    
    // Trial period
    trialStart: admin.firestore.Timestamp.fromDate(new Date('2026-08-30')),
    trialEnd: admin.firestore.Timestamp.fromDate(new Date('2026-09-30T23:59:59+01:00')),
    commissionRate: 0,
    
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log('✅ Eegoja seller doc created in sellers collection');
  console.log('Doc ID: ' + sellerId);
  console.log('Test URL: https://www.ogaslpgmarketplace.com/buy/' + sellerId);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
