import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { OGAS_COMMISSION_PERCENT } from '../../../lib/escrow';
import { requireUser } from '../../../lib/require-user';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, email, name, sellerId } = body;

    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    }

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, message: 'Missing orderId or amount' },
        { status: 400 },
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, message: 'Payment not configured' },
        { status: 500 },
      );
    }

    const orderSnap = await adminDb.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    const order = orderSnap.data()!;
    if (order.buyerId !== user.uid) {
      return NextResponse.json({ success: false, message: 'Not your order' }, { status: 403 });
    }
    const resolvedSellerId = sellerId || order.sellerId;

    const amountInKobo = Math.round(Number(amount) * 100);
    if (amountInKobo < 10000) {
      return NextResponse.json(
        { success: false, message: 'Amount too small (min ₦100)' },
        { status: 400 },
      );
    }

    const reference = `OGAS-${orderId}-${Date.now()}`;
    const commissionInKobo = Math.round(amountInKobo * (OGAS_COMMISSION_PERCENT / 100));
    const guestEmail =
      email ||
      (order.buyerPhone
        ? `${String(order.buyerPhone).replace(/\D/g, '')}@guest.ogaslpgmarketplace.com`
        : 'customer@ogaslpgmarketplace.com');

    const payload = {
      email: guestEmail,
      amount: amountInKobo,
      reference,
      metadata: {
        orderId,
        buyerName: name || order.buyerName || '',
        sellerId: resolvedSellerId || '',
        ogasCommissionPercent: OGAS_COMMISSION_PERCENT,
        ogasCommissionKobo: commissionInKobo,
        usedSplitPayment: false,
        escrow: 'held_until_door_code',
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ogaslpgmarketplace.com'}/orders?ref=${orderId}&status=paid`,
    };

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
      await adminDb.collection('orders').doc(orderId).update({
        paystackRef: reference,
        paymentStatus: 'pending',
        escrowStatus: 'pending',
        ogasCommissionPercent: OGAS_COMMISSION_PERCENT,
        usedSplitPayment: false,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        authorization_url: data.data.authorization_url,
        reference,
        split: false,
      });
    }

    console.error('Paystack init failed:', data);
    return NextResponse.json(
      { success: false, message: data.message || 'Could not start payment' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Try again.' },
      { status: 500 },
    );
  }
}
