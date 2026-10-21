import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { OGAS_COMMISSION_PERCENT } from '../../../lib/escrow';
import { requireUser } from '../../../lib/require-user';
import { orderBuyerId, orderTotal } from '../../../lib/fields';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Gas Points: 1 GP = ₦1, spendable only inside OGas.
// Points can cover at most this share of an order, so the OGas commission
// absorbs the discount and the seller payout stays based on the full total.
const MAX_POINTS_SHARE = 0.10;
const MIN_CHARGE_NAIRA = 100; // Paystack minimum

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, email, name, sellerId } = body;

    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Missing orderId' },
        { status: 400 },
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, message: 'Payment not configured' },
        { status: 500 },
      );
    }

    const orderSnap = await adminDb.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    const order = orderSnap.data()!;
    const buyerId = orderBuyerId(order);
    if (buyerId !== user.uid) {
      return NextResponse.json({ success: false, message: 'Not your order' }, { status: 403 });
    }
    const resolvedSellerId = sellerId || order.sellerId;

    const expected = orderTotal(order);
    if (expected < 100) {
      return NextResponse.json(
        { success: false, message: 'Order total is missing or too small' },
        { status: 400 },
      );
    }
    if (amount != null && Math.abs(Number(amount) - expected) > 1) {
      return NextResponse.json(
        { success: false, message: 'Amount does not match this order' },
        { status: 400 },
      );
    }

    // ── Gas Points redemption ──────────────────────────────────────────
    // Clamp to: buyer's balance, 10% of the order, and never below the
    // Paystack minimum charge. Points are only deducted after payment
    // verifies (see /api/verify-payment).
    let pointsApplied = 0;
    const requestedPoints = Math.max(0, Math.floor(Number(body.pointsToUse) || 0));
    if (requestedPoints > 0) {
      const userSnap = await adminDb.collection('users').doc(user.uid).get();
      const balance = Math.max(0, Math.floor(Number(userSnap.data()?.gasPoints) || 0));
      const maxByShare = Math.floor(expected * MAX_POINTS_SHARE);
      const maxByMinCharge = Math.max(0, Math.floor(expected - MIN_CHARGE_NAIRA));
      pointsApplied = Math.min(requestedPoints, balance, maxByShare, maxByMinCharge);
    }
    const charged = expected - pointsApplied;

    const amountInKobo = Math.round(charged * 100);
    if (amountInKobo < 10000) {
      return NextResponse.json(
        { success: false, message: 'Amount too small (min ₦100)' },
        { status: 400 },
      );
    }

    const reference = `OGAS-${orderId}-${Date.now()}`;
    const commissionInKobo = Math.round(amountInKobo * (OGAS_COMMISSION_PERCENT / 100));
    const guestEmail =
      email ||
      (order.buyerPhone
        ? `${String(order.buyerPhone).replace(/\D/g, '')}@guest.ogaslpgmarketplace.com`
        : 'customer@ogaslpgmarketplace.com');

    const payload = {
      email: guestEmail,
      amount: amountInKobo,
      reference,
      metadata: {
        orderId,
        buyerName: name || order.buyerName || '',
        sellerId: resolvedSellerId || '',
        ogasCommissionPercent: OGAS_COMMISSION_PERCENT,
        ogasCommissionKobo: commissionInKobo,
        pointsRedeemed: pointsApplied,
        usedSplitPayment: false,
        escrow: 'held_until_door_code',
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ogaslpgmarketplace.com'}/orders?ref=${orderId}&status=paid`,
    };

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.status && data.data?.authorization_url) {
      await adminDb.collection('orders').doc(orderId).update({
        paystackRef: reference,
        paymentStatus: 'pending',
        escrowStatus: 'pending',
        ogasCommissionPercent: OGAS_COMMISSION_PERCENT,
        usedSplitPayment: false,
        pointsRedeemed: pointsApplied,
        chargedAmount: charged,
        pointsDeducted: false,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        authorization_url: data.data.authorization_url,
        reference,
        split: false,
        pointsApplied,
        chargedAmount: charged,
      });
    }

    console.error('Paystack init failed:', data);
    return NextResponse.json(
      { success: false, message: data.message || 'Could not start payment' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Try again.' },
      { status: 500 },
    );
  }
}
