const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.saveSellerBankDetails = onCall(
  { region: 'us-central1', timeoutSeconds: 60 },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    const { accountNumber, bankCode, bankName, accountName } = request.data;

    if (!accountNumber || accountNumber.length !== 10) {
      throw new HttpsError('invalid-argument', 'Valid 10-digit account number is required.');
    }
    if (!bankCode) {
      throw new HttpsError('invalid-argument', 'Bank code is required.');
    }
    if (!accountName || accountName.trim().length < 3) {
      throw new HttpsError('invalid-argument', 'Account name is required.');
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new HttpsError('failed-precondition', 'Payment system not configured.');
    }

    const sellerId = auth.uid;
    const sellerRef = db.collection('sellers').doc(sellerId);
    const sellerSnap = await sellerRef.get();

    if (!sellerSnap.exists) {
      throw new HttpsError('not-found', 'Seller profile not found. Please register first.');
    }

    // 1. Resolve account name with Paystack (optional but recommended)
    let resolvedName = accountName.trim();
    try {
      const resolveRes = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: { Authorization: `Bearer ${secretKey}` },
        }
      );
      const resolveData = await resolveRes.json();
      if (resolveData.status && resolveData.data?.account_name) {
        resolvedName = resolveData.data.account_name;
      }
    } catch (e) {
      console.warn('Account resolve failed, continuing with provided name');
    }

    // 2. Create Paystack Subaccount
    const businessName = sellerSnap.data().businessName || resolvedName;

    const createRes = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_name: businessName,
        settlement_bank: bankCode,
        account_number: accountNumber,
        percentage_charge: 10, // OGas keeps 10%
        description: `OGas seller - ${businessName}`,
        primary_contact_name: resolvedName,
        primary_contact_email: auth.token.email || undefined,
        primary_contact_phone: sellerSnap.data().phone || undefined,
      }),
    });

    const createData = await createRes.json();

    if (!createData.status || !createData.data?.subaccount_code) {
      console.error('Paystack subaccount creation failed:', createData);
      throw new HttpsError(
        'internal',
        createData.message || 'Could not create payout account. Please check details and try again.'
      );
    }

    const subaccountCode = createData.data.subaccount_code;

    // 3. Save everything on the seller document
    await sellerRef.update({
      bankAccountNumber: accountNumber,
      bankCode,
      bankName: bankName || '',
      accountName: resolvedName,
      paystackSubaccountCode: subaccountCode,
      subaccountCode: subaccountCode,
      bankDetailsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      payoutReady: true,
    });

    return {
      success: true,
      message: 'Bank account linked successfully!',
      subaccountCode,
      accountName: resolvedName,
    };
  }
);
