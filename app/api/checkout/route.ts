import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

const OGAS_COMMISSION_PERCENT = 10; // 10% to OGas

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, email, name, sellerId } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, message: 'Missing orderId or amount' },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, message: 'Payment not configured' },
        { status: 500 }
      );
    }

    // Get seller subaccount for split payment
    let subaccountCode: string | null = null;
    let resolvedSellerId = sellerId;

    if (orderId) {
      const orderSnap = await adminDb.collection('orders').doc(orderId).get();
      if (orderSnap.exists) {
        const order = orderSnap.data()!;
        resolvedSellerId = resolvedSellerId || order.sellerId;
      }
    }

    if (resolvedSellerId) {
      const sellerSnap = await adminDb.collection('sellers').doc(resolvedSellerId).get();
      if (sellerSnap.exists) {
        const seller = sellerSnap.data()!;
        subaccountCode = seller.paystackSubaccountCode || seller.subaccountCode || null;
      }
    }

    const amountInKobo = Math.round(Number(amount) * 100);
    if (amountInKobo < 10000) {
      // Paystack minimum is usually ₦100
      return NextResponse.json(
        { success: false, message: 'Amount too small' },
        { status: 400 }
      );
    }

    const reference = `OGAS-${orderId}-${Date.now()}`;
    const commissionInKobo = Math.round(amountInKobo * (OGAS_COMMISSION_PERCENT / 100));

    // Build Paystack payload
    const payload: any = {
      email: email || 'customer@ogaslpgmarketplace.com',
      amount: amountInKobo,
      reference,
      metadata: {
        orderId,
        buyerName: name || '',
        sellerId: resolvedSellerId || '',
        ogasCommissionPercent: OGAS_COMMISSION_PERCENT,
        ogasCommissionKobo: commissionInKobo,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ogaslpgmarketplace.com'}/orders?ref=${orderId}&status=paid`,
    };

    // If seller has a valid subaccount → use Split Payment
    if (subaccountCode && typeof subaccountCode === 'string' && subaccountCode.length > 5) {
      payload.subaccount = subaccountCode;
      // transaction_charge = amount that goes to the main account (OGas)
      payload.transaction_charge = commissionInKobo;
      // Who bears Paystack fees? "account" = OGas main account
      payload.bearer = 'account';
    }

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.status && data.data?.authorization_url) {
      // Save reference on the order for verification
      try {
        await adminDb.collection('orders').doc(orderId).update({
          paystackRef: reference,
          paymentStatus: 'pending',
          ogasCommissionPercent: OGAS_COMMISSION_PERCENT,
          usedSplitPayment: !!(subaccountCode),
          updatedAt: new Date(),
        });
      } catch (e) {
        console.warn('Could not update order with reference:', e);
      }

      return NextResponse.json({
        success: true,
        authorization_url: data.data.authorization_url,
        reference,
        split: !!subaccountCode,
      });
    }

    console.error('Paystack init failed:', data);
    return NextResponse.json(
      { success: false, message: data.message || 'Could not start payment' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Try again.' },
      { status: 500 }
    );
  }
}
