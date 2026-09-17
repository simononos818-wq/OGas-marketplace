const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function seed() {
  await db.collection('orgs').doc('eegoja-oil-gas-ltd').set({
    name: 'Eegoja Oil & Gas Ltd',
    legalName: 'Eegoja Trading & Investments Ltd',
    brandName: 'Eegoja Oil & Gas',
    sellerType: 'plant',
    status: 'active',
    email: 'care@eegojagas.com',
    phone: '09052288367',
    dutyPhone: '',
    address: 'KM 11 Ganaja–Ajaokuta Road, Lokoja, Kogi State',
    hqAddress: 'Eegoja Crescent, No. 2 Ematokwo Close, Lokoja',
    capacityMT: 235,
    cacNumber: '',
    nmdpraLTO: '',
    nmdpraExpiry: null,
    bankName: '',
    bankCode: '',
    bankAccountNumber: '',
    bankAccountName: '',
    payoutVerified: false,
    commissionRate: 0.05,
    partnerRate: 0,
    trialStart: admin.firestore.Timestamp.fromDate(new Date('2026-08-30')),
    trialEnd: admin.firestore.Timestamp.fromDate(new Date('2026-09-30T23:59:59+01:00')),
    prices: {
      '3kg': 1050,
      '5kg': 1650,
      '6kg': 1950,
      '12.5kg': 3800,
      '25kg': 7200,
      '50kg': 13800
    },
    outletStatus: {
      ganaja: 'open',
      felele: 'open',
      gadumo: 'open'
    },
    outlets: [
      { id: 'ganaja', name: 'Ganaja Plant', address: 'KM 11 Ganaja–Ajaokuta Road, Lokoja', type: 'mother_plant', services: ['pickup', 'bulk', 'autogas'], phone: '' },
      { id: 'felele', name: 'Felele', address: 'Opposite Kogi State Polytechnic, Lokoja', type: 'retail_station', services: ['pickup'], phone: '' },
      { id: 'gadumo', name: 'Gadumo / Old Poly Quarters', address: 'Old Poly Quarters, Lokoja', type: 'retail_station', services: ['pickup'], phone: '' }
    ],
    policies: {
      cylinderCheck: true,
      cylinderPolicyText: 'Faulty cylinders will be rejected at the plant.',
      codAllowed: false,
      deliveryAvailable: false,
      bulkEnquiry: true
    },
    claimStatus: 'unclaimed',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'simon@ogaslpgmarketplace.com'
  });

  console.log('✅ Eegoja org created in Firestore');
  console.log('Doc ID: eegoja-oil-gas-ltd');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
