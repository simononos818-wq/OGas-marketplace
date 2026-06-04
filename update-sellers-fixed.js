const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Price mapping for known sellers (based on their 12.5kg prices or market rates)
const priceMap = {
  'SELLER_UGHELLI_001': 1600,  // Oteri Gas Depot
  'SELLER_UGHELLI_002': 1700,  // Ughelli Energy Hub
  'SELLER_UGHELLI_003': 1800,  // Delta Flame Gas
  'vendor-1': 1650,            // Oteri Gas Plant
  'vendor-2': 1750,            // Ughelli Mega Gas
  'vendor-3': 1850,            // Warri Express Gas
  'iI4XGGbVmVZbnXXhuPnVzaM2OHp1': 1600,  // Laura's gas
  'seller_simon_001': 1700,    // Simon Gas Oteri
  'uB339TBLEqMX6epYvHV64uF4cJ42': 1800,  // Simon Onos
};

async function updateSellers() {
  const snapshot = await db.collection('sellers').get();
  let updated = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const id = doc.id;
    
    // Calculate pricePerKg
    let pricePerKg = priceMap[id];
    
    // If no mapped price, calculate from inventory
    if (!pricePerKg && data.inventory && Array.isArray(data.inventory)) {
      const item125 = data.inventory.find(i => i.size === '12.5kg');
      if (item125) {
        pricePerKg = Math.round(item125.price / 12.5);
      }
    }
    
    // Fallback to default
    if (!pricePerKg) pricePerKg = 1600;
    
    // Build update object
    const updates = {
      pricePerKg: pricePerKg,
      isActive: true,
      isVerified: true,
      isOpen: true,
      businessName: data.name || data.businessName || 'Gas Seller',
      address: data.area || data.address || 'Oteri, Delta State',
      phone: data.phone || '+2348000000000',
      rating: data.rating || 4.5,
      reviewCount: data.totalDeliveries || Math.floor(Math.random() * 50) + 10,
      deliveryFee: 500,
      minOrderKg: 3,
      maxOrderKg: 50,
      location: 'Oteri',
      updatedAt: new Date()
    };
    
    // Only add email if not present
    if (!data.email) {
      updates.email = `seller${updated + 1}@ogas.local`;
    }
    
    await db.collection('sellers').doc(id).update(updates);
    updated++;
    console.log(`✅ Updated ${updates.businessName} (${id}): ₦${pricePerKg}/kg`);
  }
  
  console.log(`\n🎉 Updated ${updated} sellers successfully!`);
  process.exit(0);
}

updateSellers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
