const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const app = initializeApp({
  apiKey: 'AIzaSyDWvX8sL_08ecR5sqtQbGTV8RR-NiNHzEc',
  projectId: 'ogasapp-5a003'
});
const db = getFirestore(app);

getDocs(collection(db, 'sellers')).then(async snap => {
  for (const d of snap.docs) {
    const data = d.data();
    if (!data.isAvailable) {
      await updateDoc(doc(db, 'sellers', d.id), { isAvailable: true });
      console.log('Fixed:', data.businessName);
    }
  }
  console.log('All done');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
