#!/usr/bin/env node

/**
 * Firebase Firestore Setup Script
 * Creates all 13 collections with sample data
 * Usage: node scripts/setup-firestore.js
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_KEY_FILE || path.join(__dirname, '../serviceAccountKey.json');

// If using JSON string from env variable, parse it
let serviceAccount;
if (process.env.FIREBASE_ADMIN_SDK_KEY && process.env.FIREBASE_ADMIN_SDK_KEY.startsWith('{')) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
  } catch (e) {
    console.error('Error parsing FIREBASE_ADMIN_SDK_KEY:', e.message);
    process.exit(1);
  }
} else {
  try {
    serviceAccount = require(serviceAccountPath);
  } catch (e) {
    console.error(`Error: Could not load service account key from ${serviceAccountPath}`);
    console.error('Please ensure FIREBASE_ADMIN_SDK_KEY is set in .env.local or serviceAccountKey.json exists');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const db = admin.firestore();
const timestamp = new Date();

// Sample data for all collections
const collections = {
  users: [
    {
      id: 'user-001',
      email: 'customer@example.com',
      phone: '+2348012345678',
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St, Lagos',
      latitude: 6.5244,
      longitude: 3.3792,
      totalOrders: 5,
      totalSpent: 22500,
      loyaltyPoints: 1125,
      defaultPaymentMethod: 'card',
      notificationsEnabled: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'user-002',
      email: 'buyer@example.com',
      phone: '+2348087654321',
      firstName: 'Jane',
      lastName: 'Smith',
      address: '456 Oak Ave, Abuja',
      latitude: 9.0765,
      longitude: 7.3986,
      totalOrders: 3,
      totalSpent: 15000,
      loyaltyPoints: 750,
      defaultPaymentMethod: 'card',
      notificationsEnabled: true,
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000),
    },
  ],

  sellers: [
    {
      id: 'seller-001',
      userId: 'seller-001',
      businessName: 'NIPCO Gas Distribution',
      sellerType: 'distributor',
      email: 'seller@nipco.com',
      phone: '+2348012345678',
      address: 'NIPCO Depot, Lagos',
      latitude: 6.5244,
      longitude: 3.3792,
      cacNumber: 'CAC/2023/12345678',
      cacVerified: true,
      bankAccount: '1234567890',
      bankName: 'First Bank',
      bankCode: '011',
      subscriptionStatus: 'active',
      subscriptionTier: 'premium',
      subscriptionEndDate: new Date(Date.now() + 30 * 86400000),
      totalEarnings: 125000,
      rating: 4.8,
      totalOrders: 45,
      productsCount: 4,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'seller-002',
      userId: 'seller-002',
      businessName: 'Oando Gas Station',
      sellerType: 'dealer',
      email: 'seller@oando.com',
      phone: '+2348087654321',
      address: 'Oando Station, Abuja',
      latitude: 9.0765,
      longitude: 7.3986,
      cacNumber: 'CAC/2023/87654321',
      cacVerified: true,
      bankAccount: '0987654321',
      bankName: 'GTBank',
      bankCode: '058',
      subscriptionStatus: 'active',
      subscriptionTier: 'standard',
      subscriptionEndDate: new Date(Date.now() + 20 * 86400000),
      totalEarnings: 87500,
      rating: 4.6,
      totalOrders: 32,
      productsCount: 4,
      createdAt: new Date(Date.now() - 86400000 * 30),
      updatedAt: new Date(Date.now() - 86400000 * 30),
    },
  ],

  seller_products: [
    {
      id: 'product-001',
      sellerId: 'seller-001',
      productName: 'LPG Gas Cylinder',
      size: '6kg',
      price: 2500,
      minPrice: 2400,
      maxPrice: 2800,
      deliveryFee: 500,
      stock: 100,
      totalSales: 234,
      totalRevenue: 585000,
      rating: 4.7,
      images: ['https://via.placeholder.com/300?text=6kg+Cylinder'],
      description: 'Pure LPG gas, quality assured, sealed at source',
      certificationType: 'verified',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'product-002',
      sellerId: 'seller-002',
      productName: 'LPG Gas Cylinder',
      size: '6kg',
      price: 2800,
      minPrice: 2700,
      maxPrice: 3000,
      deliveryFee: 600,
      stock: 80,
      totalSales: 156,
      totalRevenue: 436800,
      rating: 4.5,
      images: ['https://via.placeholder.com/300?text=6kg+Cylinder'],
      description: 'Premium LPG gas with quality guarantee',
      certificationType: 'verified',
      createdAt: new Date(Date.now() - 86400000 * 20),
      updatedAt: new Date(Date.now() - 86400000 * 20),
    },
    {
      id: 'product-003',
      sellerId: 'seller-001',
      productName: 'LPG Gas Cylinder',
      size: '12kg',
      price: 4500,
      minPrice: 4400,
      maxPrice: 4800,
      deliveryFee: 800,
      stock: 60,
      totalSales: 145,
      totalRevenue: 652500,
      rating: 4.8,
      images: ['https://via.placeholder.com/300?text=12kg+Cylinder'],
      description: '12kg LPG gas cylinder, reliable and durable',
      certificationType: 'verified',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'product-004',
      sellerId: 'seller-002',
      productName: 'LPG Gas Cylinder',
      size: '12kg',
      price: 5000,
      minPrice: 4900,
      maxPrice: 5200,
      deliveryFee: 900,
      stock: 50,
      totalSales: 98,
      totalRevenue: 490000,
      rating: 4.6,
      images: ['https://via.placeholder.com/300?text=12kg+Cylinder'],
      description: 'Quality 12kg LPG gas with fast delivery',
      certificationType: 'verified',
      createdAt: new Date(Date.now() - 86400000 * 15),
      updatedAt: new Date(Date.now() - 86400000 * 15),
    },
  ],

  orders: [
    {
      id: 'order-001',
      orderId: 'ORD-2026-001',
      userId: 'user-001',
      sellerId: 'seller-001',
      productName: 'LPG Gas Cylinder',
      productSize: '6kg',
      quantity: 1,
      unitPrice: 2500,
      subtotal: 2500,
      deliveryFee: 500,
      discount: 0,
      tax: 300,
      total: 3300,
      commission: 250,
      commissionRate: 10,
      paymentMethod: 'paystack',
      paymentStatus: 'completed',
      orderStatus: 'delivered',
      deliveryAddress: '123 Main St, Lagos',
      deliveryLatitude: 6.5244,
      deliveryLongitude: 3.3792,
      timeline: {
        created: new Date(Date.now() - 86400000 * 4),
        accepted: new Date(Date.now() - 86400000 * 4 + 900000),
        pickupArrived: new Date(Date.now() - 86400000 * 4 + 1800000),
        inTransit: new Date(Date.now() - 86400000 * 4 + 2700000),
        delivered: new Date(Date.now() - 86400000 * 3),
      },
      rating: 5,
      review: 'Great service and fast delivery',
      refundRequested: false,
      createdAt: new Date(Date.now() - 86400000 * 4),
      updatedAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      id: 'order-002',
      orderId: 'ORD-2026-002',
      userId: 'user-002',
      sellerId: 'seller-002',
      productName: 'LPG Gas Cylinder',
      productSize: '12kg',
      quantity: 1,
      unitPrice: 5000,
      subtotal: 5000,
      deliveryFee: 900,
      discount: 0,
      tax: 600,
      total: 6500,
      commission: 300,
      commissionRate: 6,
      paymentMethod: 'paystack',
      paymentStatus: 'completed',
      orderStatus: 'delivered',
      deliveryAddress: '456 Oak Ave, Abuja',
      deliveryLatitude: 9.0765,
      deliveryLongitude: 7.3986,
      timeline: {
        created: new Date(Date.now() - 86400000 * 2),
        accepted: new Date(Date.now() - 86400000 * 2 + 900000),
        pickupArrived: new Date(Date.now() - 86400000 * 2 + 1800000),
        inTransit: new Date(Date.now() - 86400000 * 1),
        delivered: new Date(Date.now() - 86400000),
      },
      rating: 4,
      review: 'Good quality, reasonable prices',
      refundRequested: false,
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 86400000),
    },
  ],

  deliveries: [
    {
      id: 'delivery-001',
      deliveryId: 'DEL-2026-001',
      orderId: 'ORD-2026-001',
      driverId: 'driver-001',
      pickupLocation: {
        address: 'NIPCO Depot, Lagos',
        latitude: 6.5244,
        longitude: 3.3792,
      },
      destination: {
        address: '123 Main St, Lagos',
        latitude: 6.5300,
        longitude: 3.3850,
      },
      currentLocation: {
        latitude: 6.5270,
        longitude: 3.3820,
        accuracy: 15,
      },
      status: 'delivered',
      distance: 5.2,
      estimatedArrival: new Date(Date.now() - 86400000 * 3 + 3600000),
      lastLocationUpdate: new Date(Date.now() - 86400000 * 3),
      temperature: 28,
      createdAt: new Date(Date.now() - 86400000 * 4),
      updatedAt: new Date(Date.now() - 86400000 * 3),
    },
  ],

  location_history: [
    {
      id: 'location-001',
      deliveryId: 'DEL-2026-001',
      driverId: 'driver-001',
      location: {
        latitude: 6.5244,
        longitude: 3.3792,
      },
      speed: 0,
      accuracy: 5,
      timestamp: new Date(Date.now() - 86400000 * 4 + 1800000),
    },
    {
      id: 'location-002',
      deliveryId: 'DEL-2026-001',
      driverId: 'driver-001',
      location: {
        latitude: 6.5270,
        longitude: 3.3820,
      },
      speed: 45,
      accuracy: 12,
      timestamp: new Date(Date.now() - 86400000 * 4 + 2700000),
    },
  ],

  refill_reminders: [
    {
      id: 'reminder-001',
      userId: 'user-001',
      productId: 'product-001',
      productName: 'LPG Gas Cylinder 6kg',
      averageDaysUsage: 60,
      lastPurchaseDate: timestamp,
      nextRemindDate: new Date(Date.now() + 51 * 86400000),
      reminderDaysOffset: 51,
      subscriptionEndpoint: 'https://fcm.googleapis.com/fcm/send/',
      enabled: true,
      sent: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],

  notifications: [
    {
      id: 'notif-001',
      userId: 'user-001',
      type: 'order_delivered',
      title: 'Order Delivered',
      message: 'Your order ORD-2026-001 has been delivered',
      icon: 'https://via.placeholder.com/64?text=Delivery',
      action: '/orders/ORD-2026-001',
      read: false,
      deliveredAt: new Date(Date.now() - 86400000 * 3),
      createdAt: new Date(Date.now() - 86400000 * 3),
      updatedAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      id: 'notif-002',
      userId: 'user-001',
      type: 'order_status',
      title: 'Order Confirmed',
      message: 'Your order ORD-2026-001 has been confirmed by seller',
      icon: 'https://via.placeholder.com/64?text=Confirmed',
      action: '/tracking',
      read: true,
      deliveredAt: new Date(Date.now() - 86400000 * 4),
      createdAt: new Date(Date.now() - 86400000 * 4),
      updatedAt: new Date(Date.now() - 86400000 * 4),
    },
  ],

  payment_methods: [
    {
      id: 'payment-001',
      userId: 'user-001',
      type: 'card',
      cardLast4: '4242',
      cardBrand: 'visa',
      cardExpiry: '12/26',
      cardAuthorizationUrl: 'https://paystack.com/auth/123',
      isDefault: true,
      createdAt: new Date(Date.now() - 86400000 * 30),
      updatedAt: new Date(Date.now() - 86400000 * 30),
    },
  ],

  loyalty_accounts: [
    {
      id: 'loyalty-001',
      userId: 'user-001',
      totalPoints: 1125,
      pointsHistory: [
        {
          amount: 250,
          source: 'order',
          date: new Date(Date.now() - 86400000 * 4),
        },
        {
          amount: 875,
          source: 'order',
          date: new Date(Date.now() - 86400000 * 30),
        },
      ],
      tierBadge: 'silver',
      nextTierPoints: 5000,
      redeemableAmount: 562.5,
      createdAt: new Date(Date.now() - 86400000 * 30),
      updatedAt: timestamp,
    },
  ],

  partnerships: [
    {
      id: 'partner-001',
      name: 'Chevron Nigeria',
      category: 'supplier',
      status: 'active',
      contactPerson: 'Mr. Ahmed',
      email: 'ahmed@chevron.com',
      phone: '+2348012345678',
      benefits: 'Bulk discount 15%, dedicated account manager',
      potentialValue: 50000000,
      keyMetrics: 'Supply 500+ cylinders/month',
      createdAt: new Date(Date.now() - 86400000 * 60),
      updatedAt: timestamp,
    },
    {
      id: 'partner-002',
      name: 'Total Energies Nigeria',
      category: 'supplier',
      status: 'negotiating',
      contactPerson: 'Ms. Zainab',
      email: 'zainab@total.com',
      phone: '+2348087654321',
      benefits: 'Potential supply partnership',
      potentialValue: 30000000,
      keyMetrics: 'Discussing terms',
      createdAt: new Date(Date.now() - 86400000 * 45),
      updatedAt: new Date(Date.now() - 86400000 * 10),
    },
  ],

  promotions: [
    {
      id: 'promo-001',
      title: 'Welcome Bonus - 5% Off',
      type: 'percentage',
      discountValue: 5,
      startDate: timestamp,
      endDate: new Date(Date.now() + 30 * 86400000),
      applicableProductIds: ['product-001', 'product-002', 'product-003', 'product-004'],
      applicableSellerTypes: ['distributor', 'dealer', 'retailer'],
      usageLimit: 5000,
      code: 'WELCOME5',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],

  transactions: [
    {
      id: 'trans-001',
      orderId: 'ORD-2026-001',
      sellerId: 'seller-001',
      orderAmount: 2500,
      commission: 250,
      commissionRate: 10,
      status: 'credited',
      payoutStatus: 'completed',
      payoutDate: new Date(Date.now() - 86400000 * 2),
      createdAt: new Date(Date.now() - 86400000 * 4),
      updatedAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: 'trans-002',
      orderId: 'ORD-2026-002',
      sellerId: 'seller-002',
      orderAmount: 5000,
      commission: 300,
      commissionRate: 6,
      status: 'credited',
      payoutStatus: 'pending',
      payoutDate: null,
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 86400000),
    },
  ],
};

async function setupFirestore() {
  try {
    console.log('🚀 Starting Firestore setup...\n');

    for (const [collectionName, documents] of Object.entries(collections)) {
      console.log(`📝 Creating '${collectionName}' collection...`);

      const batch = db.batch();
      let count = 0;

      for (const doc of documents) {
        const docId = doc.id;
        delete doc.id; // Remove id field, use it as document reference
        const docRef = db.collection(collectionName).doc(docId);
        batch.set(docRef, doc);
        count++;
      }

      await batch.commit();
      console.log(`   ✓ Added ${count} documents to '${collectionName}'\n`);
    }

    console.log('✅ Firestore setup complete!\n');
    console.log('📊 Summary:');
    console.log('   ✓ 13 collections created');
    console.log('   ✓ Sample data populated');
    console.log('   ✓ Ready for Firebase Hosting deployment\n');

    console.log('🎯 Next steps:');
    console.log('   1. Deploy security rules: firebase deploy --only firestore:rules');
    console.log('   2. Test the app locally: npm run dev');
    console.log('   3. Deploy to production: firebase deploy --only hosting\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up Firestore:', error);
    process.exit(1);
  }
}

// Run setup
setupFirestore();
