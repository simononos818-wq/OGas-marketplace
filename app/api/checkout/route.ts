import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { adminDb } from '../../../lib/firebase-admin';
import { OGAS_COMMISSION_PERCENT } from '../../../lib/escrow';
import { requireUser } from '../../../lib/require-user';
import { orderBuyerId, orderTotal } from '../../../lib/fields';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_POINTS_SHARE = 0.10;
const MIN_CHARGE_NAIRA = 100;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    if (!orderId) return NextResponse.json({ success: false, message: 'Missing orderId' }, { status: 400 });

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) return NextResponse.json({ success: false, message: 'Payment not configured' }, { status: 500 });

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    const order = orderSnap.data()!;
    if (orderBuyerId(order) !== user.uid) return NextResponse.json({ success: false, message: 'Not your order' }, { status: 403 });
    if (
      order.paymentStatus === 'paid' || order.status === 'paid' ||
      order.status === 'cancelled' || order.status === 'expired' ||
      order.escrowStatus === 'held' || order.escrowStatus === 'released' ||
      order.paymentMethod === 'cash'
    ) {
      return NextResponse.json({ success: false, message: 'This order is already paid or does not need online payment' }, { status: 409 });
    }

    const totalExpected = orderTotal(order);
    const orderOnlineAmt = Number(order.onlineAmount) || 0;
    const expectedOnlineNaira = orderOnlineAmt >= MIN_CHARGE_NAIRA && orderOnlineAmt < totalExpected
      ? orderOnlineAmt
      : totalExpected;
    if (!Number.isFinite(expectedOnlineNaira) || expectedOnlineNaira < MIN_CHARGE_NAIRA) {
      return NextResponse.json({ success: false, message: 'Order total is missing or too small' }, { status: 400 });
    }

    // Gas Points are applied server-side. The browser never supplies the charge amount.
    let pointsApplied = 0;
    const requestedPoints = Math.max(0, Math.floor(Number(body.pointsToUse) || 0));
    if (requestedPoints > 0) {
      const userSnap = await adminDb.collection('users').doc(user.uid).get();
      const rawBalance = Math.max(0, Math.floor(Number(userSnap.data()?.gasPoints) || 0));
      let held = 0;
      let reservationCheckSucceeded = true;
      try {
        const cutoff = Date.now() - 2 * 60 * 60 * 1000;
        const pendingSnap = await adminDb.collection('orders')
          .where('buyerId', '==', user.uid)
          .where('paymentStatus', '==', 'pending')
          .get();
        pendingSnap.forEach((d) => {
          if (d.id === orderId) return;
          const o: any = d.data();
          const ts = o.updatedAt?.toMillis ? o.updatedAt.toMillis() : new Date(o.updatedAt || 0).getTime();
          if (ts >= cutoff) held += Math.max(0, Math.floor(Number(o.pointsRedeemed) || 0));
        });
      } catch (err) {
        reservationCheckSucceeded = false;
        console.error('Gas Points reservation check failed; checkout continues without points:', err);
      }
      const available = reservationCheckSucceeded ? Math.max(0, rawBalance - held) : 0;
      const maxByShare = Math.floor(expectedOnlineNaira * MAX_POINTS_SHARE);
      const maxByMinimum = Math.max(0, Math.floor(expectedOnlineNaira - MIN_CHARGE_NAIRA));
      pointsApplied = Math.min(requestedPoints, available, maxByShare, maxByMinimum);
    }

    const chargedNaira = expectedOnlineNaira - pointsApplied;
    const amountKobo = Math.round(chargedNaira * 100);
    if (!Number.isSafeInteger(amountKobo) || amountKobo < MIN_CHARGE_NAIRA * 100) {
      return NextResponse.json({ success: false, message: 'Amount too small (minimum ₦100)' }, { status: 400 });
    }

    const isSplit = Number(order.cashBalance) > 0 || order.paymentMethod === 'split';
    const reference = `ogas_${orderId}_${randomBytes(8).toString('hex')}`;
    const orderCommissionPercent = Number.isFinite(Number(order.ogasCommissionPercent))
      ? Number(order.ogasCommissionPercent)
      : OGAS_COMMISSION_PERCENT;
    const commissionInKobo = Math.round(amountKobo * (orderCommissionPercent / 100));
    const buyerEmail = user.email || order.buyerEmail ||
      (order.buyerPhone ? `${String(order.buyerPhone).replace(/\\D/g, '')}@guest.ogaslpgmarketplace.com` : 'customer@ogaslpgmarketplace.com');

    // Reserve the exact reference and payable amount before contacting Paystack.
    // Concurrent checkout requests cannot silently replace an in-flight payment.
    const reservation = await adminDb.runTransaction(async (tx) => {
      const currentSnap = await tx.get(orderRef);
      if (!currentSnap.exists) throw new Error('ORDER_NOT_FOUND');
      const current: any = currentSnap.data();
      if (orderBuyerId(current) !== user.uid) throw new Error('NOT_ORDER_BUYER');
      if (current.paymentStatus === 'paid' || current.status === 'paid' || current.status === 'cancelled' || current.status === 'expired') {
        throw new Error('ORDER_NOT_PAYABLE');
      }
      const existing = current.payment || {};
      if (existing.status === 'pending' && existing.reference) {
        if (Number(existing.amountKobo) !== amountKobo) throw new Error('PAYMENT_ALREADY_PENDING');
        if (existing.authorizationUrl) {
          return { existing: true as const, reference: existing.reference as string, url: existing.authorizationUrl as string };
        }
        throw new Error('CHECKOUT_IN_PROGRESS');
      }
      const currentTotal = orderTotal(current);
      const currentOnline = Number(current.onlineAmount) || 0;
      const currentExpected = currentOnline >= MIN_CHARGE_NAIRA && currentOnline < currentTotal ? currentOnline : currentTotal;
      if (Math.round(currentExpected * 100) !== Math.round(expectedOnlineNaira * 100)) throw new Error('ORDER_AMOUNT_CHANGED');
      tx.update(orderRef, {
        payment: {
          reference,
          provider: 'paystack',
          amountKobo,
          currency: 'NGN',
          status: 'pending',
          createdAt: new Date(),
        },
        paystackRef: reference,
        paymentStatus: 'pending',
        escrowStatus: 'pending',
        chargedAmount: chargedNaira,
        pointsRedeemed: pointsApplied,
        pointsDeducted: false,
        usedSplitPayment: isSplit,
        ogasCommissionPercent: orderCommissionPercent,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        updatedAt: new Date(),
      });
      return { existing: false as const, reference, url: '' };
    });

    if (reservation.existing) {
      return NextResponse.json({
        success: true,
        authorization_url: reservation.url,
        reference: reservation.reference,
        split: isSplit,
        pointsApplied,
        chargedAmount: chargedNaira,
      });
    }

    const payload = {
      email: buyerEmail,
      amount: amountKobo,
      currency: 'NGN',
      reference,
      metadata: {
        orderId,
        buyerName: order.buyerName || '',
        sellerId: order.sellerId || '',
        ogasCommissionPercent: orderCommissionPercent,
        ogasCommissionKobo: commissionInKobo,
        pointsRedeemed: pointsApplied,
        usedSplitPayment: isSplit,
        escrow: 'held_until_door_code',
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ogaslpgmarketplace.com'}/orders?ref=${encodeURIComponent(orderId)}`,
    };

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.status || !data.data?.authorization_url) {
      console.error('Paystack initialization rejected:', { status: res.status, message: data.message, reference });
      await orderRef.update({
        'payment.status': 'initialization_failed',
        'payment.initializationError': String(data.message || 'Paystack initialization failed').slice(0, 160),
        updatedAt: new Date(),
      });
      return NextResponse.json({ success: false, message: data.message || 'Could not start payment' }, { status: 502 });
    }

    await adminDb.runTransaction(async (tx) => {
      const latest = await tx.get(orderRef);
      if (!latest.exists || latest.data()?.payment?.reference !== reference) {
        throw new Error('PAYMENT_REFERENCE_CHANGED');
      }
      tx.update(orderRef, {
        'payment.authorizationUrl': data.data.authorization_url,
        'payment.status': 'pending',
        updatedAt: new Date(),
      });
    });

    return NextResponse.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference,
      split: isSplit,
      pointsApplied,
      chargedAmount: chargedNaira,
      cashBalance: Math.max(0, Number(order.cashBalance) || 0),
    });
  } catch (error: any) {
    const code = String(error?.message || '');
    if (code === 'ORDER_NOT_FOUND') return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    if (code === 'NOT_ORDER_BUYER') return NextResponse.json({ success: false, message: 'Not your order' }, { status: 403 });
    if (code === 'ORDER_NOT_PAYABLE') return NextResponse.json({ success: false, message: 'This order cannot be paid' }, { status: 409 });
    if (code === 'CHECKOUT_IN_PROGRESS') return NextResponse.json({ success: false, message: 'Payment checkout is already being prepared. Please wait a moment and refresh.' }, { status: 409 });
    if (code === 'PAYMENT_ALREADY_PENDING') return NextResponse.json({ success: false, message: 'A payment is already open for this order. Resume that checkout before starting another payment.' }, { status: 409 });
    if (code === 'ORDER_AMOUNT_CHANGED') return NextResponse.json({ success: false, message: 'The order amount changed. Refresh the order and try again.' }, { status: 409 });
    console.error('Checkout error:', error);
    return NextResponse.json({ success: false, message: 'Server error. Try again.' }, { status: 500 });
  }
}
