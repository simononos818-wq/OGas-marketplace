const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize with your service account
const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function updateSellers() {
  const snapshot = await db.collection('sellers').get();
  let updated = 0;
  
  snapshot.forEach(async (doc) => {
    const data = doc.data();
    
    // Skip if already has pricePerKg
    if (data.pricePerKg) {
      console.log(`Skipping ${doc.id} - already has pricePerKg`);
      return;
    }
    
    // Calculate pricePerKg from 12.5kg inventory item
    let pricePerKg = 800; // default
    if (data.inventory && Array.isArray(data.inventory)) {
      const item125 = data.inventory.find(i => i.size === '12.5kg');
      if (item125) {
        pricePerKg = Math.round(item125.price / 12.5);
      } else if (data.inventory[0]) {
        // Fallback to first item
        const first = data.inventory[0];
        const size = parseFloat(first.size.replace('kg', ''));
        pricePerKg = Math.round(first.price / size);
      }
    }
    
    // Update the seller
    await db.collection('sellers').doc(doc.id).update({
      pricePerKg: pricePerKg,
      isActive: true,
      isVerified: true,
      isOpen: true,
      businessName: data.name || data.businessName || 'Gas Seller',
      address: data.area || data.address || 'Oteri, Delta',
      phone: data.phone || '+2348000000000',
      rating: data.rating || 4.0,
      reviewCount: data.totalDeliveries || 0,
      deliveryFee: 500,
      minOrderKg: 3,
      maxOrderKg: 50,
      location: 'Oteri',
      updatedAt: new Date()
    });
    
    updated++;
    console.log(`Updated ${data.name || doc.id}: ₦${pricePerKg}/kg`);
  });
  
  console.log(`\n✅ Updated ${updated} sellers`);
  process.exit(0);
}

updateSellers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
