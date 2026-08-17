import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { reference, orderId } = await req.json();

    if (!reference) {
      return NextResponse.json({ success: false, message: 'Missing reference' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false, message: 'Not configured' }, { status: 500 });
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await res.json();

    if (!data.status || data.data?.status !== 'success') {
      return NextResponse.json({ success: false, message: 'Payment not verified' }, { status: 400 });
    }

    const resolvedOrderId = orderId || data.data?.metadata?.orderId;
    if (!resolvedOrderId) {
      console.warn('Payment verified but no orderId found. Ref:', reference);
      return NextResponse.json({ success: false, message: 'Payment verified but order not linked' }, { status: 400 });
    }

    const orderRef = adminDb.collection('orders').doc(resolvedOrderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    const order = orderSnap.data()!;

    // Prevent replaying a reference against a different order
    if (order.paystackRef && order.paystackRef !== reference) {
      console.error(`Reference mismatch for order ${resolvedOrderId}`);
      return NextResponse.json({ success: false, message: 'Reference mismatch' }, { status: 400 });
    }
    if (order.status === 'paid') {
      return NextResponse.json({ success: true, message: 'Order already marked paid', orderId: resolvedOrderId });
    }

    // CRITICAL: confirm the amount actually paid matches what the order expects
    const expectedKobo = Math.round(((order.total || order.totalPrice || 0)) * 100);
    const paidKobo = data.data.amount;
    if (expectedKobo <= 0 || paidKobo !== expectedKobo) {
      console.error(`Amount mismatch for order ${resolvedOrderId}: expected ${expectedKobo}, paid ${paidKobo}`);
      return NextResponse.json({ success: false, message: 'Amount mismatch' }, { status: 400 });
    }

    await orderRef.update({
      status: 'paid',
      paymentStatus: 'paid',
      paystackRef: reference,
      paystackAmount: data.data.amount,
      customerEmail: data.data.customer?.email || null,
      paidAt: new Date(),
      verifiedAt: new Date(),
      verifiedViaApi: true,
    });

    console.log(`Order ${resolvedOrderId} verified and marked paid ✅`);
    return NextResponse.json({ success: true, message: 'Payment verified', orderId: resolvedOrderId });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
