import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';
import { notifyPaidEscrow } from '../../../lib/escrow';
import { postSystemMessage } from '../../../lib/chat-server';

async function findPaystackReference(secret: string, orderId?: string, reference?: string) {
  if (reference) return String(reference);
  if (!orderId) return '';

  const orderSnap = await adminDb.collection('orders').doc(orderId).get();
  const stored = orderSnap.data()?.paystackRef as string | undefined;
  if (stored) return stored;

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
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = (body.orderId as string | undefined)?.trim();
    const bodyRef = (body.reference as string | undefined)?.trim();

    if (!orderId && !bodyRef) {
      return NextResponse.json({ success: false, message: 'Missing orderId or reference' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false, message: 'Paystack not configured' }, { status: 500 });
    }

    let resolvedOrderId = orderId || '';
    if (!resolvedOrderId && bodyRef) {
      const verifyPeek = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(bodyRef)}`,
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );
      const peek = await verifyPeek.json();
      resolvedOrderId = peek.data?.metadata?.orderId || '';
    }

    if (!resolvedOrderId) {
      return NextResponse.json({ success: false, message: 'Could not link this payment to an order' }, { status: 400 });
    }

    const orderRef = adminDb.collection('orders').doc(resolvedOrderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    const order = orderSnap.data()!;

    if (order.buyerId !== user.uid && order.sellerId !== user.uid) {
      return NextResponse.json({ success: false, message: 'Not your order' }, { status: 403 });
    }

    if (order.paymentStatus === 'paid' || order.status === 'paid') {
      return NextResponse.json({ success: true, message: 'Already marked paid', orderId: resolvedOrderId });
    }

    const reference = await findPaystackReference(secretKey, resolvedOrderId, bodyRef);
    if (!reference) {
      return NextResponse.json({
        success: false,
        message: 'No Paystack reference on this order yet. Confirm the charge in Paystack Transactions.',
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

    const metaOrderId = data.data?.metadata?.orderId;
    if (metaOrderId && metaOrderId !== resolvedOrderId) {
      return NextResponse.json({ success: false, message: 'Payment does not match this order' }, { status: 400 });
    }

    const paidKobo = Number(data.data.amount);
    const expectedNaira = Number(order.totalAmount || order.total || order.totalPrice || 0);
    const expectedKobo = Math.round(expectedNaira * 100);
    if (expectedKobo > 0 && Math.abs(paidKobo - expectedKobo) > 100) {
      return NextResponse.json({
        success: false,
        message: 'Paid amount does not match order total',
      }, { status: 400 });
    }

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

    return NextResponse.json({
      success: true,
      message: 'Payment held in escrow',
      orderId: resolvedOrderId,
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
