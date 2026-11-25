/**
 * One-time admin bootstrap: grant the trusted `admin` custom claim to a
 * fixed admin account. The hardened Firestore rules only trust
 * request.auth.token.admin == true or the verified fixed admin email.
 *
 * Run with Firebase Admin credentials (Application Default Credentials, or
 * GOOGLE_APPLICATION_CREDENTIALS pointing at a service account JSON).
 *
 *   GOOGLE_CLOUD_PROJECT=ogasapp-5a003 node scripts/set-admin-claim.js you@example.com
 *
 * Prints no tokens, claims payloads, or secrets.
 */
const admin = require('firebase-admin');

const email = process.argv[2];
if (!email) {
  process.stderr.write('Usage: GOOGLE_CLOUD_PROJECT=<project-id> node scripts/set-admin-claim.js <email>\n');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
}

async function main() {
  const user = await admin.auth().getUserByEmail(email);
  const claims = { ...(user.customClaims || {}), admin: true };
  await admin.auth().setCustomUserClaims(user.uid, claims);
  process.stdout.write(
    `Admin claim set for ${email} (uid ${user.uid}). ` +
    'Sign out and back in (or refresh the ID token) before it takes effect.\n',
  );
}

main().catch((error) => {
  process.stderr.write(`Failed: ${error.message}\n`);
  process.exitCode = 1;
});
