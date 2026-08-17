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

    // Already paid – idempotent
    if (order.paymentStatus === 'paid' || order.status === 'paid') {
      return NextResponse.json({ success: true, message: 'Order already marked paid', orderId: resolvedOrderId });
    }

    // Reference safety
    if (order.paystackRef && order.paystackRef !== reference) {
      console.error(`Reference mismatch for order ${resolvedOrderId}`);
      return NextResponse.json({ success: false, message: 'Reference mismatch' }, { status: 400 });
    }

    // === SMART AMOUNT CHECK ===
    // Look at every possible total field the app has used
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

    // Allow ±2 naira tolerance for rounding / floating-point issues
    const difference = Math.abs(paidKobo - expectedKobo);
    const isMatch = expectedKobo > 0 && difference <= 200; // 200 kobo = ₦2

    if (!isMatch) {
      console.error(`Amount mismatch for order ${resolvedOrderId}:
        expected fields: ${JSON.stringify(possibleTotals)}
        expectedKobo: ${expectedKobo}
        paidKobo: ${paidKobo}
        difference: ${difference} kobo`);
      return NextResponse.json({ 
        success: false, 
        message: 'Amount mismatch',
        debug: { expectedKobo, paidKobo, difference }
      }, { status: 400 });
    }

    // Mark paid
    await orderRef.update({
      status: 'paid',
      paymentStatus: 'paid',
      paystackRef: reference,
      paystackAmount: paidKobo,
      customerEmail: data.data.customer?.email || null,
      paidAt: new Date(),
      verifiedAt: new Date(),
      verifiedViaApi: true,
      updatedAt: new Date(),
    });

    console.log(`✅ Order ${resolvedOrderId} verified and marked paid (paid ${paidKobo} kobo)`);
    return NextResponse.json({ success: true, message: 'Payment verified', orderId: resolvedOrderId });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
