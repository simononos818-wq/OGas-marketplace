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
    if (signature) {
      const hash = createHmac('sha512', secret).update(rawBody).digest('hex');
      try {
        const a = Buffer.from(hash, 'hex');
        const b = Buffer.from(String(signature), 'hex');
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          console.error('webhook bad signature');
        }
      } catch {
        console.error('webhook signature parse');
      }
    }

    const event = JSON.parse(rawBody);
    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true });
    }

    const data = event.data;
    const reference = data.reference;
    const orderId = data.metadata?.orderId;
    if (!reference) {
      return NextResponse.json({ received: true });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const verified = await verifyRes.json();
    if (!verified.status || verified.data?.status !== 'success') {
      return NextResponse.json({ received: true, skipped: 'not_success' });
    }

    const resolvedOrderId = orderId || verified.data?.metadata?.orderId;
    if (!resolvedOrderId) {
      return NextResponse.json({ received: true, skipped: 'no_order' });
    }

    const orderRef = adminDb.collection('orders').doc(resolvedOrderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ received: true, skipped: 'missing_order' });
    }
    const order = orderSnap.data()!;
    if (order.paymentStatus === 'paid' || order.status === 'paid') {
      return NextResponse.json({ received: true, message: 'Already processed' });
    }

    const paidKobo = verified.data.amount;
    await orderRef.update({
      status: 'paid',
      paymentStatus: 'paid',
      escrowStatus: 'held',
      usedSplitPayment: false,
      paystackRef: reference,
      paystackAmount: paidKobo,
      paidAt: new Date(),
      verifiedAt: new Date(),
      verifiedViaWebhook: true,
      customerEmail: verified.data.customer?.email || null,
      updatedAt: new Date(),
    });

    await notifyPaidEscrow(resolvedOrderId);
    await postSystemMessage(resolvedOrderId, 'Chat is open. Payment is locked in escrow until Door Code or buyer confirm.');

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true, error: 'logged' });
  }
}
