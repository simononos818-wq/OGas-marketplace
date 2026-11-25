/**
 * One-time migration: move seller payout details out of publicly readable
 * sellers/{sellerId} documents into server-only sellerPrivate/{sellerId}.
 *
 * Run with Firebase Admin Application Default Credentials after reviewing
 * the target project. This script does not print or export any bank details.
 * Example: GOOGLE_CLOUD_PROJECT=<project-id> node scripts/migrate-seller-bank-private.js
 */
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
}
const db = admin.firestore();
const PRIVATE_FIELDS = [
  'accountNumber',
  'bankCode',
  'bankName',
  'accountName',
  'bankResolved',
  'bankUpdatedAt',
  'paystackRecipientCode',
  'bankLocked',
];

async function main() {
  let last = null;
  let migrated = 0;
  while (true) {
    let query = db.collection('sellers').orderBy(admin.firestore.FieldPath.documentId()).limit(200);
    if (last) query = query.startAfter(last);
    const page = await query.get();
    if (page.empty) break;

    const batch = db.batch();
    let writes = 0;
    for (const doc of page.docs) {
      const data = doc.data();
      const privateData = {};
      const publicPatch = {};
      for (const field of PRIVATE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
          privateData[field] = data[field];
          publicPatch[field] = admin.firestore.FieldValue.delete();
        }
      }
      if (Object.keys(privateData).length) {
        batch.set(db.collection('sellerPrivate').doc(doc.id), {
          ...privateData,
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        batch.update(doc.ref, publicPatch);
        writes += 2;
        migrated += 1;
      }
    }
    if (writes) await batch.commit();
    last = page.docs[page.docs.length - 1];
    if (page.size < 200) break;
  }
  process.stdout.write(`Migration complete. Seller records moved: ${migrated}. No bank values were logged.\n`);
}

main().catch((error) => {
  process.stderr.write(`Migration failed: ${error.message}\n`);
  process.exitCode = 1;
});
