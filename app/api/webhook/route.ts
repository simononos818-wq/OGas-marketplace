import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { adminDb } from '../../../lib/firebase-admin';
import { notifyPaidEscrow } from '../../../lib/escrow';
import { postSystemMessage } from '../../../lib/chat-server';

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

    const hash = createHmac('sha512', secret).update(rawBody).digest('hex');
    try {
      const a = Buffer.from(hash, 'hex');
      const b = Buffer.from(String(signature), 'hex');
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } catch {
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
      return NextResponse.json({ received: true });
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ received: true });
    }

    const order = orderSnap.data()!;

    if (order.paymentStatus === 'paid' || order.status === 'paid') {
      return NextResponse.json({ received: true, message: 'Already processed' });
    }

    if (order.paystackRef && order.paystackRef !== reference) {
      return NextResponse.json({ error: 'Reference mismatch' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    await orderRef.update({
      status: 'paid',
      paymentStatus: 'paid',
      escrowStatus: 'held',
      usedSplitPayment: false,
      paystackRef: reference,
      paystackAmount: paidAmount,
      paidAt: new Date(),
      verifiedAt: new Date(),
      verifiedViaWebhook: true,
      customerEmail: data.customer?.email || null,
      updatedAt: new Date(),
    });

    await notifyPaidEscrow(orderId);
    await postSystemMessage(orderId, 'Chat is open. Payment is locked in escrow until Door Code or buyer confirm.');

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
