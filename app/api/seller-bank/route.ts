import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    }

    const body = await req.json();
    const accountNumber = String(body.accountNumber || '').replace(/\D/g, '');
    const bankCode = String(body.bankCode || '').trim();
    const bankName = String(body.bankName || '').trim();
    let accountName = String(body.accountName || '').trim();

    if (accountNumber.length !== 10) {
      return NextResponse.json({ success: false, message: 'Enter a valid 10-digit account number' }, { status: 400 });
    }
    if (!bankCode) {
      return NextResponse.json({ success: false, message: 'Select your bank' }, { status: 400 });
    }
    if (!accountName || accountName.length < 2) {
      return NextResponse.json({ success: false, message: 'Enter account name' }, { status: 400 });
    }

    const sellerRef = adminDb.collection('sellers').doc(user.uid);
    const sellerSnap = await sellerRef.get();
    if (!sellerSnap.exists) {
      return NextResponse.json({ success: false, message: 'Seller profile not found. Register as a seller first.' }, { status: 404 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (secret) {
      try {
        const r = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${encodeURIComponent(bankCode)}`,
          { headers: { Authorization: `Bearer ${secret}` } },
        );
        const j = await r.json();
        if (j.status && j.data?.account_name) {
          accountName = String(j.data.account_name).trim();
        }
      } catch (err) {
        console.error('bank resolve failed', err);
      }
    }

    await sellerRef.set(
      {
        accountNumber,
        bankCode,
        bankName,
        accountName,
        bankUpdatedAt: new Date(),
        paystackRecipientCode: null,
      },
      { merge: true },
    );

    // Payout retry sweep: pay out orders released while seller had no bank
    // details. Only orders where Paystack holds money (paystackRef present) —
    // cash orders are excluded so we never double-pay.
    let retried = 0;
    let paidNow = 0;
    try {
      const ordersSnap = await adminDb
        .collection('orders')
        .where('sellerId', '==', user.uid)
        .get();
      const stuck = ordersSnap.docs.filter((d) => {
        const o: any = d.data();
        return (
          o.escrowStatus === 'released' &&
          o.paystackRef &&
          (o.payoutStatus === 'awaiting_bank' ||
            o.payoutStatus === 'pending_manual' ||
            o.payoutStatus === 'failed' ||
            !o.payoutStatus)
        );
      });
      if (stuck.length > 0) {
        const escrowMod: any = await import('../../../lib/escrow');
        const paySellerFromEscrow = escrowMod.paySellerFromEscrow;
        if (typeof paySellerFromEscrow === 'function') {
          for (const d of stuck) {
            retried++;
            try {
              const r: any = await paySellerFromEscrow(d.id, 'bank_details_added');
              if (r && (r.payoutStatus === 'sent' || r.success === true)) paidNow++;
            } catch (e) {
              console.error('payout retry failed for', d.id, e);
            }
          }
        }
      }
    } catch (e) {
      console.error('payout sweep error', e);
    }

    return NextResponse.json({
      success: true,
      accountName,
      message: 'Payout account saved.',
      retried,
      paidNow,
    });
  } catch (error: any) {
    console.error('seller-bank', error);
    return NextResponse.json({ success: false, message: error.message || 'Could not save bank details' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    }
    const sellerSnap = await adminDb.collection('sellers').doc(user.uid).get();
    if (!sellerSnap.exists) {
      return NextResponse.json({ success: false, message: 'Seller not found' }, { status: 404 });
    }
    const s = sellerSnap.data()!;
    return NextResponse.json({
      success: true,
      accountNumber: s.accountNumber || '',
      bankCode: s.bankCode || '',
      bankName: s.bankName || '',
      accountName: s.accountName || '',
      hasBank: Boolean(s.accountNumber && s.bankCode),
    });
  } catch (error: any) {
    console.error('seller-bank get', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
