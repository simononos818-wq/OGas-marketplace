import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { adminDb } from '../../../lib/firebase-admin';
import { notifyPaidEscrow } from '../../../lib/escrow';
import { postSystemMessage } from '../../../lib/chat-server';
import { notifyOrderEvent } from '../../../lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac('sha512', secret).update(rawBody).digest();
  const supplied = Buffer.from(signature, 'hex');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function expectedKobo(order: Record<string, any>): number {
  const paymentAmount = Number(order.payment?.amountKobo);
  if (Number.isSafeInteger(paymentAmount) && paymentAmount > 0) return paymentAmount;
  const legacyNaira = Number(order.chargedAmount ?? order.onlineAmount ?? order.totalAmount ?? order.total ?? order.totalPrice ?? 0);
  return Number.isFinite(legacyNaira) && legacyNaira > 0 ? Math.round(legacyNaira * 100) : 0;
}

async function recordRejectedPayment(details: Record<string, unknown>) {
  console.error('Paystack webhook rejected payment:', details);
  try {
    await adminDb.collection('webhookAlerts').add({
      type: 'paystack_integrity_rejection',
      ...details,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('Could not persist Paystack rejection alert:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const rawBody = await req.text();
    if (!validSignature(rawBody, req.headers.get('x-paystack-signature'), secret)) {
      console.error('Paystack webhook signature invalid');
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }
    if (event?.event !== 'charge.success') return NextResponse.json({ received: true });

    const eventData = event.data || {};
    const reference = typeof eventData.reference === 'string' ? eventData.reference : '';
    if (!reference) return NextResponse.json({ received: true, skipped: 'missing_reference' });

    // Always ask Paystack's server-side API for the canonical transaction record.
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    });
    if (!verifyRes.ok) throw new Error(`Paystack verification HTTP ${verifyRes.status}`);
    const verified = await verifyRes.json();
    const payment = verified?.data || {};
    if (!verified?.status || payment.status !== 'success') {
      return NextResponse.json({ received: true, skipped: 'transaction_not_successful' });
    }

    if (
      payment.reference !== reference ||
      payment.currency !== 'NGN' ||
      !Number.isSafeInteger(Number(payment.amount))
    ) {
      await recordRejectedPayment({ reference, reason: 'provider_reference_currency_or_amount_invalid' });
      return NextResponse.json({ received: true, skipped: 'provider_data_mismatch' });
    }

    // The stored order reference is the authority. Metadata is only a secondary
    // cross-check and can never select an order.
    const [canonicalMatches, legacyMatches] = await Promise.all([
      adminDb.collection('orders').where('payment.reference', '==', reference).limit(2).get(),
      adminDb.collection('orders').where('paystackRef', '==', reference).limit(2).get(),
    ]);
    const uniqueMatches = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    canonicalMatches.docs.forEach((doc) => uniqueMatches.set(doc.id, doc));
    legacyMatches.docs.forEach((doc) => uniqueMatches.set(doc.id, doc));
    if (uniqueMatches.size !== 1) {
      await recordRejectedPayment({ reference, reason: uniqueMatches.size === 0 ? 'no_stored_reference_match' : 'multiple_stored_reference_matches', matchCount: uniqueMatches.size });
      return NextResponse.json({ received: true, skipped: 'order_reference_not_unique' });
    }

    const matchedDoc = [...uniqueMatches.values()][0];
    const orderId = matchedDoc.id;
    const metadataOrderId = payment.metadata?.orderId || eventData.metadata?.orderId;
    if (metadataOrderId && String(metadataOrderId) !== orderId) {
      await recordRejectedPayment({ reference, orderId, metadataOrderId: String(metadataOrderId), reason: 'metadata_order_crosscheck_failed' });
      return NextResponse.json({ received: true, skipped: 'metadata_crosscheck_failed' });
    }

    const orderRef = matchedDoc.ref;
    const expected = expectedKobo(matchedDoc.data());
    if (!expected || Number(payment.amount) !== expected) {
      await recordRejectedPayment({ reference, orderId, expectedAmountKobo: expected, receivedAmountKobo: Number(payment.amount), reason: 'exact_amount_mismatch' });
      return NextResponse.json({ received: true, skipped: 'amount_mismatch' });
    }
    const storedCurrency = matchedDoc.data()?.payment?.currency || 'NGN';
    if (storedCurrency !== 'NGN') {
      await recordRejectedPayment({ reference, orderId, storedCurrency, receivedCurrency: payment.currency, reason: 'stored_currency_mismatch' });
      return NextResponse.json({ received: true, skipped: 'currency_mismatch' });
    }

    const buyerId = String(matchedDoc.data()?.buyerId || matchedDoc.data()?.userId || '');
    const buyerRef = buyerId ? adminDb.collection('users').doc(buyerId) : null;
    const spendLogRef = adminDb.collection('pointsTransactions').doc();
    const earnLogRef = adminDb.collection('pointsTransactions').doc();
    const eventRef = adminDb.collection('paymentWebhookEvents').doc(createHash('sha256').update(reference).digest('hex'));
    const paidAt = new Date();

    const transition = await adminDb.runTransaction(async (tx) => {
      const currentSnap = await tx.get(orderRef);
      if (!currentSnap.exists) return { state: 'missing' as const };
      const current: any = currentSnap.data();
      const currentStoredReference = current.payment?.reference || current.paystackRef;
      if (currentStoredReference !== reference) return { state: 'reference_changed' as const };
      const currentExpected = expectedKobo(current);
      if (currentExpected !== Number(payment.amount)) return { state: 'amount_changed' as const };
      if ((current.payment?.currency || 'NGN') !== 'NGN') return { state: 'currency_changed' as const };
      if (current.paymentStatus === 'paid' || current.payment?.status === 'paid' || current.status === 'paid') {
        return { state: 'already_paid' as const };
      }
      if (current.paymentStatus !== 'pending' && current.payment?.status !== 'pending') {
        return { state: 'not_pending' as const };
      }

      let buyerSnap: any = null;
      if (buyerRef) buyerSnap = await tx.get(buyerRef);
      const balance = Math.max(0, Math.floor(Number(buyerSnap?.data()?.gasPoints) || 0));
      const pointsRedeemed = Math.max(0, Math.floor(Number(current.pointsRedeemed) || 0));
      const deduct = current.pointsDeducted ? 0 : Math.min(pointsRedeemed, balance);
      const earn = current.pointsEarned ? 0 : Math.min(500, Math.floor((Number(payment.amount) / 100) * 0.02));
      const nextBalance = balance - deduct + earn;

      tx.update(orderRef, {
        status: 'paid',
        paymentStatus: 'paid',
        escrowStatus: 'held',
        usedSplitPayment: Number(current.cashBalance) > 0 || current.paymentMethod === 'split',
        paystackRef: reference,
        paystackAmount: Number(payment.amount),
        cardFeeKobo: 0,
        payment: {
          ...(current.payment || {}),
          reference,
          provider: 'paystack',
          amountKobo: Number(payment.amount),
          currency: 'NGN',
          status: 'paid',
          paystackTxnId: String(payment.id ?? ''),
          verifiedAmountKobo: Number(payment.amount),
          channel: String(payment.channel || ''),
          paidAt,
          verifiedAt: paidAt,
        },
        paidAt,
        verifiedAt: paidAt,
        verifiedViaWebhook: true,
        customerEmail: payment.customer?.email || null,
        pointsDeducted: true,
        pointsDeductedCount: deduct,
        pointsEarned: true,
        pointsEarnedCount: earn,
        updatedAt: paidAt,
      });
      if (buyerRef && (deduct > 0 || earn > 0)) {
        tx.set(buyerRef, { gasPoints: nextBalance, updatedAt: paidAt }, { merge: true });
      }
      if (buyerId && deduct > 0) {
        tx.set(spendLogRef, { uid: buyerId, type: 'spend', points: deduct, reason: 'order_discount', orderId, reference, createdAt: paidAt });
      }
      if (buyerId && earn > 0) {
        tx.set(earnLogRef, { uid: buyerId, type: 'earn', points: earn, reason: 'order_cashback', orderId, reference, createdAt: paidAt });
      }
      tx.set(eventRef, {
        reference,
        orderId,
        type: 'charge.success',
        status: 'confirmed',
        amountKobo: Number(payment.amount),
        currency: 'NGN',
        channel: String(payment.channel || ''),
        paystackTxnId: String(payment.id ?? ''),
        createdAt: paidAt,
      }, { merge: true });
      return { state: 'paid' as const, order: current };
    });

    if (transition.state === 'missing' || transition.state === 'reference_changed' || transition.state === 'amount_changed' || transition.state === 'currency_changed' || transition.state === 'not_pending') {
      await recordRejectedPayment({ reference, orderId, reason: transition.state });
      return NextResponse.json({ received: true, skipped: transition.state });
    }
    if (transition.state === 'already_paid') return NextResponse.json({ received: true, message: 'Already processed' });

    const order = transition.order;
    // Payment is committed before external notifications. A notification failure
    // is logged separately and cannot roll back or invalidate a confirmed payment.
    const notifications = await Promise.allSettled([
      notifyPaidEscrow(orderId),
      postSystemMessage(orderId, 'Payment is confirmed and locked in escrow until Door Code or buyer confirmation.'),
      (async () => {
        const sellerId = order.sellerId || order.vendorId || order.shopId;
        let sellerPhone: string | undefined;
        const sellerName = order.sellerName || order.vendorName || order.shopName;
        if (sellerId) {
          const sellerSnap = await adminDb.collection('sellers').doc(String(sellerId)).get();
          const seller = sellerSnap.data() || {};
          sellerPhone = seller.phone || seller.phoneNumber || seller.whatsapp;
        }
        const buyerPhone = order.buyerPhone || order.customerPhone || order.phone;
        const kg = Number(order.kg || order.kilograms || order.gasSize || 0);
        const total = Number(order.total || order.totalAmount || 0);
        await notifyOrderEvent({ id: orderId, buyerPhone, sellerPhone, sellerName, kg, total }, 'placed');
      })(),
    ]);
    notifications.forEach((result, index) => {
      if (result.status === 'rejected') console.error('Post-payment notification failed:', { index, error: result.reason });
    });

    return NextResponse.json({ received: true, paymentStatus: 'paid' });
  } catch (error) {
    console.error('Paystack webhook processing error:', error);
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }
}
