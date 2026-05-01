const admin = require('firebase-admin');

// Initialize with your service account
const serviceAccount = require('../google-services.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ogasapp-5a003.firebaseio.com"
});

const db = admin.firestore();

const sellers = [
  {
    id: "seller_001",
    businessName: "Lagos Premium Gas",
    ownerName: "Emmanuel Okafor",
    email: "emmanuel@lagospremiumgas.com",
    phone: "+2348012345678",
    address: "12 Ogunlana Drive, Surulere, Lagos",
    location: { lat: 6.5244, lng: 3.3792 },
    city: "Lagos",
    state: "Lagos",
    lpgSizes: {
      "3kg": { price: 4200, inStock: true },
      "5kg": { price: 6500, inStock: true },
      "6kg": { price: 7800, inStock: true },
      "12.5kg": { price: 15200, inStock: true },
      "25kg": { price: 30000, inStock: false }
    },
    rating: 4.7,
    totalDeliveries: 1243,
    isVerified: true,
    licenseNumber: "LPG-LG-2024-001",
    licenseImage: "https://firebasestorage.googleapis.com/v0/b/ogasapp-5a003.appspot.com/o/licenses%2Fseller_001_license.jpg?alt=media",
    bankAccount: {
      bankName: "GTBank",
      accountNumber: "0123456789",
      accountName: "Lagos Premium Gas Ltd"
    },
    paystackSubaccountCode: "AC_001_demo",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    isActive: true,
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop",
    deliveryFee: 500,
    deliveryTimeMinutes: 45
  },
  {
    id: "seller_002",
    businessName: "Abuja Gas Hub",
    ownerName: "Aisha Mohammed",
    email: "aisha@abujagashub.ng",
    phone: "+2348098765432",
    address: "45 Garki Area 10, Abuja",
    location: { lat: 9.0765, lng: 7.3986 },
    city: "Abuja",
    state: "FCT",
    lpgSizes: {
      "3kg": { price: 4500, inStock: true },
      "5kg": { price: 6800, inStock: true },
      "6kg": { price: 8200, inStock: true },
      "12.5kg": { price: 15800, inStock: true },
      "25kg": { price: 31000, inStock: true }
    },
    rating: 4.9,
    totalDeliveries: 2156,
    isVerified: true,
    licenseNumber: "LPG-AB-2024-002",
    licenseImage: "https://firebasestorage.googleapis.com/v0/b/ogasapp-5a003.appspot.com/o/licenses%2Fseller_002_license.jpg?alt=media",
    bankAccount: {
      bankName: "Zenith Bank",
      accountNumber: "0987654321",
      accountName: "Abuja Gas Hub"
    },
    paystackSubaccountCode: "AC_002_demo",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    isActive: true,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    deliveryFee: 700,
    deliveryTimeMinutes: 60
  },
  {
    id: "seller_003",
    businessName: "Port Harcourt Energy",
    ownerName: "Chinedu Nwosu",
    email: "chinedu@phenergy.com",
    phone: "+2348034567890",
    address: "78 Aba Road, Port Harcourt",
    location: { lat: 4.8156, lng: 7.0498 },
    city: "Port Harcourt",
    state: "Rivers",
    lpgSizes: {
      "3kg": { price: 4300, inStock: true },
      "5kg": { price: 6600, inStock: false },
      "6kg": { price: 7900, inStock: true },
      "12.5kg": { price: 15400, inStock: true },
      "25kg": { price: 30500, inStock: true }
    },
    rating: 4.5,
    totalDeliveries: 876,
    isVerified: true,
    licenseNumber: "LPG-PH-2024-003",
    licenseImage: "https://firebasestorage.googleapis.com/v0/b/ogasapp-5a003.appspot.com/o/licenses%2Fseller_003_license.jpg?alt=media",
    bankAccount: {
      bankName: "First Bank",
      accountNumber: "1122334455",
      accountName: "PH Energy Ltd"
    },
    paystackSubaccountCode: "AC_003_demo",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    isActive: true,
    image: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=400&h=300&fit=crop",
    deliveryFee: 600,
    deliveryTimeMinutes: 50
  },
  {
    id: "seller_004",
    businessName: "Ibadan Gas Depot",
    ownerName: "Fatima Adebayo",
    email: "fatima@ibadangas.ng",
    phone: "+2348056789012",
    address: "23 Ring Road, Ibadan",
    location: { lat: 7.3775, lng: 3.9470 },
    city: "Ibadan",
    state: "Oyo",
    lpgSizes: {
      "3kg": { price: 4100, inStock: true },
      "5kg": { price: 6400, inStock: true },
      "6kg": { price: 7700, inStock: true },
      "12.5kg": { price: 15000, inStock: true },
      "25kg": { price: 29800, inStock: false }
    },
    rating: 4.6,
    totalDeliveries: 654,
    isVerified: true,
    licenseNumber: "LPG-IB-2024-004",
    licenseImage: "https://firebasestorage.googleapis.com/v0/b/ogasapp-5a003.appspot.com/o/licenses%2Fseller_004_license.jpg?alt=media",
    bankAccount: {
      bankName: "UBA",
      accountNumber: "2233445566",
      accountName: "Ibadan Gas Depot"
    },
    paystackSubaccountCode: "AC_004_demo",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    isActive: true,
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop",
    deliveryFee: 400,
    deliveryTimeMinutes: 40
  },
  {
    id: "seller_005",
    businessName: "Kano Gas Suppliers",
    ownerName: "Ibrahim Yusuf",
    email: "ibrahim@kanogas.ng",
    phone: "+2348078901234",
    address: "56 Murtala Mohammed Way, Kano",
    location: { lat: 12.0022, lng: 8.5920 },
    city: "Kano",
    state: "Kano",
    lpgSizes: {
      "3kg": { price: 4000, inStock: true },
      "5kg": { price: 6200, inStock: true },
      "6kg": { price: 7500, inStock: true },
      "12.5kg": { price: 14800, inStock: true },
      "25kg": { price: 29000, inStock: true }
    },
    rating: 4.4,
    totalDeliveries: 432,
    isVerified: true,
    licenseNumber: "LPG-KN-2024-005",
    licenseImage: "https://firebasestorage.googleapis.com/v0/b/ogasapp-5a003.appspot.com/o/licenses%2Fseller_005_license.jpg?alt=media",
    bankAccount: {
      bankName: "Access Bank",
      accountNumber: "3344556677",
      accountName: "Kano Gas Suppliers"
    },
    paystackSubaccountCode: "AC_005_demo",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    isActive: true,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    deliveryFee: 300,
    deliveryTimeMinutes: 35
  }
];

async function seedSellers() {
  console.log('🚀 Seeding sellers to Firestore...\n');
  
  for (const seller of sellers) {
    const { id, ...data } = seller;
    await db.collection('sellers').doc(id).set(data);
    console.log(`✅ Added: ${data.businessName} (${data.city})`);
  }
  
  console.log('\n🎉 All sellers seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Total sellers: ${sellers.length}`);
  console.log(`   Cities covered: ${[...new Set(sellers.map(s => s.city))].join(', ')}`);
  console.log(`   States covered: ${[...new Set(sellers.map(s => s.state))].join(', ')}`);
  
  process.exit(0);
}

seedSellers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
