const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

try {
  const serviceAccount = require('./serviceAccountKey.json');
  initializeApp({ credential: cert(serviceAccount) });
} catch (e) {
  console.log('No service account, trying default credentials...');
  initializeApp();
}

const db = getFirestore();

async function checkSellers() {
  const snapshot = await db.collection('sellers').get();
  console.log(`Found ${snapshot.size} sellers:\n`);
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  Name: ${data.name || data.businessName || 'NO NAME'}`);
    console.log(`  Has pricePerKg: ${data.pricePerKg ? 'YES (' + data.pricePerKg + ')' : 'NO'}`);
    console.log(`  Has inventory: ${data.inventory ? 'YES (' + data.inventory.length + ' items)' : 'NO'}`);
    console.log(`  isActive: ${data.isActive}`);
    console.log(`  isVerified: ${data.isVerified}`);
    console.log('');
  });
}

checkSellers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
