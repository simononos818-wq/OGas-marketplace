import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true });
    }

    const data = event.data;
    const reference = data.reference;
    const paidAmount = data.amount;
    const metadata = data.metadata || {};
    const orderId = metadata.orderId;

    if (!orderId) {
      console.warn('charge.success without orderId. Ref:', reference);
      return NextResponse.json({ received: true });
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ received: true });
    }

    const order = orderSnap.data()!;

    if (order.paymentStatus === 'paid' || order.status === 'paid') {
      return NextResponse.json({ received: true, message: 'Already processed' });
    }

    if (order.paystackRef && order.paystackRef !== reference) {
      console.error(`Reference mismatch on order ${orderId}`);
      return NextResponse.json({ error: 'Reference mismatch' }, { status: 400 });
    }

    // Smart amount check (same as verify)
    const possibleTotals = [
      order.total,
      order.totalAmount,
      order.totalPrice,
      order.amount,
      order.grandTotal,
    ].filter((v) => typeof v === 'number' && !isNaN(v) && v > 0);

    const expectedNaira = possibleTotals.length > 0 ? Math.max(...possibleTotals) : 0;
    const expectedKobo = Math.round(expectedNaira * 100);
    const difference = Math.abs(paidAmount - expectedKobo);

    if (expectedKobo > 0 && difference > 200) {
      console.error(`Amount mismatch on order ${orderId}: expected ${expectedKobo}, got ${paidAmount}`);
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    await orderRef.update({
      status: 'paid',
      paymentStatus: 'paid',
      paystackRef: reference,
      paystackAmount: paidAmount,
      paidAt: new Date(),
      verifiedAt: new Date(),
      verifiedViaWebhook: true,
      customerEmail: data.customer?.email || null,
      usedSplitPayment: metadata.usedSplitPayment || false,
      updatedAt: new Date(),
    });

    console.log(`✅ Webhook: Order ${orderId} marked paid (ref: ${reference})`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
