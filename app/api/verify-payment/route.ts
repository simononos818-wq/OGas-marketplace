import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { notifyPaidEscrow } from '../../../lib/escrow';
import { postSystemMessage } from '../../../lib/chat-server';

async function findPaystackReference(secret: string, orderId?: string, reference?: string) {
  if (reference) return String(reference);
  if (!orderId) return '';
  const res = await fetch('https://api.paystack.co/transaction?perPage=50', {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  const hit = (data.data || []).find(
    (t: any) => t.status === 'success' && t.metadata?.orderId === orderId,
  );
  return hit?.reference || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.orderId as string | undefined;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false, message: 'Paystack not configured' }, { status: 500 });
    }

    const reference = await findPaystackReference(secretKey, orderId, body.reference);
    if (!reference) {
      return NextResponse.json({
        success: false,
        message: 'No Paystack reference on this order. Open Paystack → Transactions and confirm the ₦1,400 charge.',
      }, { status: 400 });
    }

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    const data = await res.json();
    if (!data.status || data.data?.status !== 'success') {
      return NextResponse.json({
        success: false,
        message: data.message || 'Paystack has not confirmed this payment',
      }, { status: 400 });
    }

    const resolvedOrderId = orderId || data.data?.metadata?.orderId;
    if (!resolvedOrderId) {
      return NextResponse.json({ success: false, message: 'Payment verified but order not linked' }, { status: 400 });
    }

    const orderRef = adminDb.collection('orders').doc(resolvedOrderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    const order = orderSnap.data()!;
    if (order.paymentStatus === 'paid' || order.status === 'paid') {
      return NextResponse.json({ success: true, message: 'Already marked paid', orderId: resolvedOrderId });
    }

    const paidKobo = data.data.amount;
    await orderRef.update({
      status: 'paid',
      paymentStatus: 'paid',
      escrowStatus: 'held',
      usedSplitPayment: false,
      paystackRef: reference,
      paystackAmount: paidKobo,
      customerEmail: data.data.customer?.email || null,
      paidAt: new Date(),
      verifiedAt: new Date(),
      verifiedViaApi: true,
      updatedAt: new Date(),
    });

    await notifyPaidEscrow(resolvedOrderId);
    await postSystemMessage(
      resolvedOrderId,
      'Chat is open. Payment is locked in escrow until Door Code or buyer confirm.',
    );

    return NextResponse.json({ success: true, message: 'Payment held in escrow', orderId: resolvedOrderId });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
