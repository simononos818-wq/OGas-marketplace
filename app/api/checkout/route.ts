import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

const OGAS_COMMISSION_PERCENT = 10; // 10% to OGas

function isValidPaystackSubaccount(code: unknown): code is string {
  return typeof code === 'string' && code.startsWith('ACCT_') && code.length > 8;
}

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

    let subaccountCode: string | null = null;
    let resolvedSellerId = sellerId;

    // Resolve sellerId from order if needed
    if (orderId) {
      try {
        const orderSnap = await adminDb.collection('orders').doc(orderId).get();
        if (orderSnap.exists) {
          const order = orderSnap.data()!;
          resolvedSellerId = resolvedSellerId || order.sellerId;
        }
      } catch (e) {
        console.warn('Could not read order:', e);
      }
    }

    // Load seller subaccount (only if valid ACCT_ code)
    if (resolvedSellerId) {
      try {
        const sellerSnap = await adminDb.collection('sellers').doc(resolvedSellerId).get();
        if (sellerSnap.exists) {
          const seller = sellerSnap.data()!;
          const raw = seller.paystackSubaccountCode || seller.subaccountCode || null;
          if (isValidPaystackSubaccount(raw)) {
            subaccountCode = raw;
          } else if (raw) {
            console.warn(`Invalid subaccount on seller ${resolvedSellerId}:`, raw);
          }
        }
      } catch (e) {
        console.warn('Could not read seller:', e);
      }
    }

    const amountInKobo = Math.round(Number(amount) * 100);
    if (amountInKobo < 10000) {
      return NextResponse.json(
        { success: false, message: 'Amount too small (min ₦100)' },
        { status: 400 }
      );
    }

    const reference = `OGAS-${orderId}-${Date.now()}`;
    const commissionInKobo = Math.round(amountInKobo * (OGAS_COMMISSION_PERCENT / 100));

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
        usedSplitPayment: false,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ogaslpgmarketplace.com'}/orders?ref=${orderId}&status=paid`,
    };

    // Only attach split when we have a real Paystack subaccount
    if (subaccountCode) {
      payload.subaccount = subaccountCode;
      payload.transaction_charge = commissionInKobo; // 10% stays with OGas
      payload.bearer = 'account';
      payload.metadata.usedSplitPayment = true;
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
      try {
        await adminDb.collection('orders').doc(orderId).update({
          paystackRef: reference,
          paymentStatus: 'pending',
          ogasCommissionPercent: OGAS_COMMISSION_PERCENT,
          usedSplitPayment: !!subaccountCode,
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
