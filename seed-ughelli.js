const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const sellers = [
  {
    sellerId: "SELLER_UGHELLI_001",
    businessName: "Oteri Gas Depot",
    ownerName: "Efe Ovie",
    phone: "08034567890",
    email: "oterigas@ogas.ng",
    city: "Ughelli",
    state: "Delta State",
    area: "Oteri",
    address: "12 Oteri Market Road, Ughelli",
    geolocation: { latitude: 5.50437, longitude: 5.979584 },
    products: [
      { productId: "refill-3kg", name: "3kg Gas Refill", price: 1600, stock: 20, unit: "per refill" },
      { productId: "refill-6kg", name: "6kg Gas Refill", price: 3200, stock: 15, unit: "per refill" },
      { productId: "refill-12.5kg", name: "12.5kg Gas Refill", price: 6500, stock: 12, unit: "per refill" },
    ],
    rating: 4.5,
    totalOrders: 45,
    isActive: true,
    isVerified: true,
    deliveryRadiusKm: 5,
    supportsPickup: true,
    supportsDelivery: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    sellerId: "SELLER_UGHELLI_002",
    businessName: "Ughelli Energy Hub",
    ownerName: "Aghogho Emeka",
    phone: "08045678901",
    email: "ughellienergy@ogas.ng",
    city: "Ughelli",
    state: "Delta State",
    area: "Otovwodo",
    address: "45 Otovwodo Junction, Ughelli",
    geolocation: { latitude: 5.488262, longitude: 6.001054 },
    products: [
      { productId: "refill-3kg", name: "3kg Gas Refill", price: 1650, stock: 18, unit: "per refill" },
      { productId: "refill-6kg", name: "6kg Gas Refill", price: 3300, stock: 14, unit: "per refill" },
      { productId: "refill-12.5kg", name: "12.5kg Gas Refill", price: 6600, stock: 10, unit: "per refill" },
    ],
    rating: 4.2,
    totalOrders: 32,
    isActive: true,
    isVerified: true,
    deliveryRadiusKm: 7,
    supportsPickup: true,
    supportsDelivery: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    sellerId: "SELLER_UGHELLI_003",
    businessName: "Delta Flame Gas",
    ownerName: "Oghenekaro Blessing",
    phone: "08056789012",
    email: "deltaflame@ogas.ng",
    city: "Ughelli",
    state: "Delta State",
    area: "Ekiugbo",
    address: "78 Ekiugbo Street, Ughelli",
    geolocation: { latitude: 5.487998, longitude: 5.985814 },
    products: [
      { productId: "refill-3kg", name: "3kg Gas Refill", price: 1550, stock: 25, unit: "per refill" },
      { productId: "refill-6kg", name: "6kg Gas Refill", price: 3100, stock: 20, unit: "per refill" },
      { productId: "refill-12.5kg", name: "12.5kg Gas Refill", price: 6400, stock: 15, unit: "per refill" },
    ],
    rating: 4.7,
    totalOrders: 67,
    isActive: true,
    isVerified: true,
    deliveryRadiusKm: 10,
    supportsPickup: true,
    supportsDelivery: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }
];

async function seed() {
  const batch = db.batch();
  for (const seller of sellers) {
    batch.set(db.collection('sellers').doc(seller.sellerId), seller);
    for (const product of seller.products) {
      batch.set(db.collection('products').doc(`${seller.sellerId}_${product.productId}`), {
        ...product,
        sellerId: seller.sellerId,
        businessName: seller.businessName,
        city: seller.city,
        area: seller.area,
        geolocation: seller.geolocation,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  await batch.commit();
  console.log('✅ 3 Ughelli sellers seeded successfully');
  process.exit(0);
}
seed().catch(err => { console.error('❌ Error:', err); process.exit(1); });
