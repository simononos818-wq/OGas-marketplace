const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('../serviceAccountKey.json')) });
const db = admin.firestore();

async function register() {
  const sellerId = 'eegoja-oil-gas-ltd';
  
  // Create seller document (matches your existing seller schema)
  await db.collection('sellers').doc(sellerId).set({
    uid: sellerId,
    sellerId: sellerId,
    name: 'Eegoja Oil & Gas Ltd',
    displayName: 'Eegoja Oil & Gas',
    businessName: 'Eegoja Trading & Investments Ltd',
    sellerType: 'plant',
    status: 'active',
    isActive: true,
    isVerified: true,
    
    // Contact
    email: 'care@eegojagas.com',
    phone: '09052288367',
    
    // Location
    address: 'KM 11 Ganaja–Ajaokuta Road, Lokoja, Kogi State',
    city: 'Lokoja',
    state: 'Kogi',
    coordinates: { lat: 7.8006, lng: 6.7433 },
    
    // Capacity & compliance
    capacityMT: 235,
    cacNumber: '',
    nmdpraLTO: '',
    
    // Bank (empty until claimed)
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    paystackSubaccountCode: '',
    
    // Products & prices
    products: [
      { size: '3kg', price: 1050, available: true },
      { size: '5kg', price: 1650, available: true },
      { size: '6kg', price: 1950, available: true },
      { size: '12.5kg', price: 3800, available: true },
      { size: '25kg', price: 7200, available: true },
      { size: '50kg', price: 13800, available: true }
    ],
    
    // Services
    services: {
      pickup: true,
      delivery: false,
      bulk: true
    },
    
    // Outlets
    outlets: [
      { id: 'ganaja', name: 'Ganaja Plant', address: 'KM 11 Ganaja–Ajaokuta Road, Lokoja', active: true },
      { id: 'felele', name: 'Felele', address: 'Opposite Kogi State Polytechnic, Lokoja', active: true },
      { id: 'gadumo', name: 'Gadumo / Old Poly Quarters', address: 'Old Poly Quarters, Lokoja', active: true }
    ],
    
    // Ratings & stats
    rating: 0,
    totalOrders: 0,
    totalEarnings: 0,
    
    // Metadata
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'simon@ogaslpgmarketplace.com'
  });

  // Also update the org doc to link them
  await db.collection('orgs').doc(sellerId).update({
    sellerId: sellerId,
    linkedToSeller: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('✅ Eegoja registered as OGas seller');
  console.log('Buyer URL: https://www.ogaslpgmarketplace.com/buy/' + sellerId);
  console.log('Seller Dashboard: https://www.ogaslpgmarketplace.com/seller/dashboard');
  process.exit(0);
}

register().catch(err => {
  console.error('Registration failed:', err);
  process.exit(1);
});
