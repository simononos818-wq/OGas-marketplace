import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      console.error('PAYSTACK_SECRET_KEY missing');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Raw body is required for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify signature (HMAC SHA512)
    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid Paystack signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // We only care about successful charges
    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true });
    }

    const data = event.data;
    const reference = data.reference;
    const paidAmount = data.amount; // in kobo
    const metadata = data.metadata || {};
    const orderId = metadata.orderId;

    if (!orderId) {
      console.warn('charge.success without orderId in metadata. Ref:', reference);
      return NextResponse.json({ received: true });
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      console.error('Order not found for webhook:', orderId);
      return NextResponse.json({ received: true });
    }

    const order = orderSnap.data()!;

    // Idempotency – already paid
    if (order.paymentStatus === 'paid' || order.status === 'paid') {
      return NextResponse.json({ received: true, message: 'Already processed' });
    }

    // Safety: reference must match what we stored
    if (order.paystackRef && order.paystackRef !== reference) {
      console.error(`Reference mismatch on order ${orderId}`);
      return NextResponse.json({ error: 'Reference mismatch' }, { status: 400 });
    }

    // Safety: amount must match
    const expectedKobo = Math.round((order.total || order.totalPrice || order.amount || 0) * 100);
    if (expectedKobo > 0 && paidAmount !== expectedKobo) {
      console.error(`Amount mismatch on order ${orderId}: expected ${expectedKobo}, got ${paidAmount}`);
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // Mark order paid
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
