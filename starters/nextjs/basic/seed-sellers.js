const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const sellers = [
  {
    uid: 'seller_simon_001',
    businessName: 'Simon Gas Oteri',
    ownerName: 'Simon Onos',
    phone: '08031234567',
    location: { state: 'Delta', lga: 'Ughelli North', address: 'Oteri Ughelli' },
    gasSizes: ['3kg', '6kg', '12.5kg'],
    prices: { '3kg': 8500, '6kg': 16500, '12.5kg': 32000 },
    deliveryFee: 500,
    isAvailable: true,
    isVerified: true,
    rating: 5.0,
    totalOrders: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seed() {
  for (const s of sellers) {
    await db.collection('sellers').doc(s.uid).set(s);
  }
  console.log('✅ Seeded Simon as seller');
}
seed();
