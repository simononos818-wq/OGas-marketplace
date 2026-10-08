import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/require-user';

// GET /api/seller-bank/resolve?accountNumber=0123456789&bankCode=011
// Live Paystack account-name resolution so sellers see the verified
// account name BEFORE saving. Never exposes the secret key to the client.
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountNumber = String(searchParams.get('accountNumber') || '').replace(/\D/g, '');
    const bankCode = String(searchParams.get('bankCode') || '').trim();

    if (accountNumber.length !== 10 || !bankCode) {
      return NextResponse.json({ success: false, message: 'Provide a 10-digit account number and bank' }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ success: false, message: 'Bank verification not configured' }, { status: 503 });
    }

    const r = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${encodeURIComponent(bankCode)}`,
      { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' },
    );
    const j = await r.json();

    if (j.status && j.data?.account_name) {
      return NextResponse.json({
        success: true,
        accountName: String(j.data.account_name).trim(),
        accountNumber: String(j.data.account_number || accountNumber),
      });
    }

    return NextResponse.json({ success: false, message: 'Could not verify this account. Check the number and bank.' }, { status: 422 });
  } catch (error: any) {
    console.error('seller-bank resolve', error);
    return NextResponse.json({ success: false, message: 'Verification failed. Try again.' }, { status: 500 });
  }
}
