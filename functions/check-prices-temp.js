const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ projectId: 'ogasapp-5a003' });
const db = getFirestore();

db.collection('sellers').get().then(snap => {
  snap.forEach(doc => {
    const d = doc.data();
    if (!d.pricePerKg) {
      console.log('MISSING PRICE:', doc.id, '-', d.businessName || '(no name)');
    } else {
      console.log('ok:', doc.id, '-', d.businessName || '(no name)', '- ₦' + d.pricePerKg);
    }
  });
  process.exit(0);
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
