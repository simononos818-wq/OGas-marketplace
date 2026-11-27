import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';
import { orderBuyerId } from '../../../lib/fields';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This endpoint is deliberately read-only. Paystack's signed webhook is the
// only path allowed to transition an order to paid.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const callbackReference = typeof body.reference === 'string' ? body.reference.trim() : '';
    if (!orderId) return NextResponse.json({ success: false, message: 'Missing orderId' }, { status: 400 });

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    const order = orderSnap.data()!;
    if (orderBuyerId(order) !== user.uid) {
      return NextResponse.json({ success: false, message: 'Only the buyer can check this payment' }, { status: 403 });
    }

    if (order.paymentStatus === 'paid' || order.payment?.status === 'paid' || order.status === 'paid') {
      return NextResponse.json({ success: true, paid: true, orderId, message: 'Payment is confirmed and held in escrow.' });
    }

    const storedReference = String(order.payment?.reference || order.paystackRef || '');
    if (!storedReference) {
      return NextResponse.json({ success: false, message: 'No payment reference is stored for this order.' }, { status: 409 });
    }
    if (callbackReference && callbackReference !== storedReference) {
      return NextResponse.json({ success: false, message: 'Callback reference does not match this order.' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) return NextResponse.json({ success: false, message: 'Paystack not configured' }, { status: 500 });

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(storedReference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ success: false, message: 'Could not verify payment with Paystack yet.' }, { status: 502 });
    const result = await res.json();
    const payment = result?.data || {};
    if (!result?.status || payment.status !== 'success') {
      return NextResponse.json({ success: false, message: result?.message || 'Paystack has not confirmed this payment.' }, { status: 409 });
    }

    const expectedKobo = Number(order.payment?.amountKobo) ||
      Math.round(Number(order.chargedAmount ?? order.onlineAmount ?? order.totalAmount ?? order.total ?? order.totalPrice ?? 0) * 100);
    if (
      payment.reference !== storedReference ||
      payment.currency !== 'NGN' ||
      Number(payment.amount) !== expectedKobo ||
      (payment.metadata?.orderId && String(payment.metadata.orderId) !== orderId)
    ) {
      console.error('Read-only payment verification mismatch:', { orderId, storedReference, providerReference: payment.reference, expectedKobo, paidKobo: payment.amount, currency: payment.currency });
      return NextResponse.json({ success: false, message: 'Payment details do not match this order. Contact OGas support if you were charged.' }, { status: 409 });
    }

    // Do not update Firestore here. The authenticated Paystack webhook performs
    // the atomic pending -> paid transition after signature verification.
    return NextResponse.json({
      success: true,
      paid: false,
      awaitingWebhook: true,
      orderId,
      message: 'Paystack confirms the charge. OGas is waiting for its secure payment notification to finalise escrow.',
    });
  } catch (error) {
    console.error('Read-only payment verification error:', error);
    return NextResponse.json({ success: false, message: 'Server error checking payment' }, { status: 500 });
  }
}
