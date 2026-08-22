import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { notifyPaidEscrow } from '../../../lib/escrow';
import { postSystemMessage } from '../../../lib/chat-server';

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
      return NextResponse.json({ success: false, message: 'Payment verified but order not linked' }, { status: 400 });
    }

    const orderRef = adminDb.collection('orders').doc(resolvedOrderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    const order = orderSnap.data()!;

    if (order.paymentStatus === 'paid' || order.status === 'paid') {
      return NextResponse.json({ success: true, message: 'Order already marked paid', orderId: resolvedOrderId });
    }

    if (order.paystackRef && order.paystackRef !== reference) {
      return NextResponse.json({ success: false, message: 'Reference mismatch' }, { status: 400 });
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
    const paidKobo = data.data.amount;
    const difference = Math.abs(paidKobo - expectedKobo);
    const isMatch = expectedKobo > 0 && difference <= 200;

    if (!isMatch) {
      return NextResponse.json({
        success: false,
        message: 'Amount mismatch',
        debug: { expectedKobo, paidKobo, difference },
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
    await postSystemMessage(resolvedOrderId, 'Chat is open. Payment is locked in escrow until Door Code or buyer confirm.');

    return NextResponse.json({ success: true, message: 'Payment held in escrow', orderId: resolvedOrderId });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
