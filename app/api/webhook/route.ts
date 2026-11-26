import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { adminDb } from '../../../lib/firebase-admin';
import { notifyPaidEscrow } from '../../../lib/escrow';
import { postSystemMessage } from '../../../lib/chat-server';
import { notifyOrderEvent } from '../../../lib/notify';
import { validatePaystackTransaction } from '../../../lib/paystack-verification';

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const hash = createHmac('sha512', secret).update(rawBody).digest('hex');
    const sigA = Buffer.from(hash, 'hex');
    const sigB = Buffer.from(signature, 'hex');
    if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
      console.error('webhook bad signature');
      return NextResponse.json({ ok: false }, { status: 401 });
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

    const verifiedOrderId = verified.data?.metadata?.orderId;
    if (!verifiedOrderId || (orderId && orderId !== verifiedOrderId) || verified.data?.reference !== reference) {
      return NextResponse.json({ received: true, skipped: 'transaction_identity_mismatch' });
    }
    const resolvedOrderId = verifiedOrderId;

    const orderRef = adminDb.collection('orders').doc(resolvedOrderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ received: true, skipped: 'missing_order' });
    }
    const order = orderSnap.data()!;
    if (order.paymentStatus === 'paid' || order.status === 'paid') {
      return NextResponse.json({ received: true, message: 'Already processed' });
    }

    if (order.paystackRef !== reference) {
      return NextResponse.json({ received: true, skipped: 'stored_reference_mismatch' });
    }
    // Gas Points reduce the stored charge. OGas absorbs Paystack fees, so
    // Paystack's verified NGN amount must equal the exact checkout amount.
    const expectedNaira = Number(
      order.chargedAmount ?? order.totalAmount ?? order.total ?? order.totalPrice ?? 0,
    );
    const expectedKobo = Math.round(expectedNaira * 100);
    const validation = validatePaystackTransaction(verified.data, resolvedOrderId, reference, expectedKobo);
    if (!validation.ok) {
      console.error('webhook transaction validation failed', { orderId: resolvedOrderId, reason: validation.reason });
      try {
        await adminDb.collection('webhookAlerts').add({
          type: validation.reason,
          orderId: resolvedOrderId,
          reference,
          paidKobo: Number(verified.data?.amount) || 0,
          expectedNaira,
          createdAt: new Date(),
        });
      } catch (alertErr) {
        console.error('webhook alert write failed:', alertErr);
      }
      return NextResponse.json({ received: true, skipped: validation.reason });
    }
    const paidKobo = validation.paidKobo;

    const transition = await adminDb.runTransaction(async (tx) => {
      const current = await tx.get(orderRef);
      if (!current.exists) return 'missing';
      const currentOrder = current.data()!;
      if (currentOrder.paymentStatus === 'paid' || currentOrder.status === 'paid') return 'already';
      if (currentOrder.paystackRef !== reference) return 'reference_mismatch';
      if (currentOrder.paymentStatus !== 'pending' || currentOrder.cancelledAt) return 'not_payable';
      tx.update(orderRef, {
        status: 'paid',
        paymentStatus: 'paid',
        escrowStatus: 'held',
        usedSplitPayment: false,
        paystackAmount: paidKobo,
        paidAt: new Date(),
        verifiedAt: new Date(),
        verifiedViaWebhook: true,
        customerEmail: verified.data.customer?.email || null,
        updatedAt: new Date(),
      });
      return 'updated';
    });
    if (transition === 'already') return NextResponse.json({ received: true, message: 'Already processed' });
    if (transition !== 'updated') return NextResponse.json({ received: true, skipped: transition });

    // ── Gas Points deduction (atomic, exactly once) ────────────────────
    const pointsRedeemed = Math.max(0, Math.floor(Number(order.pointsRedeemed) || 0));
    if (pointsRedeemed > 0 && !order.pointsDeducted && order.buyerId) {
      const buyerRef = adminDb.collection('users').doc(order.buyerId);
      const txLogRef = adminDb.collection('pointsTransactions').doc();
      try {
        await adminDb.runTransaction(async (tx) => {
          const [oSnap, uSnap] = await Promise.all([tx.get(orderRef), tx.get(buyerRef)]);
          if (oSnap.data()?.pointsDeducted) return;
          const balance = Math.max(0, Math.floor(Number(uSnap.data()?.gasPoints) || 0));
          const deduct = Math.min(pointsRedeemed, balance);
          tx.set(buyerRef, { gasPoints: balance - deduct }, { merge: true });
          tx.update(orderRef, { pointsDeducted: true, pointsDeductedCount: deduct });
          tx.set(txLogRef, {
            uid: order.buyerId,
            type: 'spend',
            points: deduct,
            reason: 'order_discount',
            orderId: resolvedOrderId,
            createdAt: new Date(),
          });
        });
      } catch (pointsErr) {
        // Payment is already confirmed — never fail the order over points.
        console.error('Points deduction failed (payment still valid):', pointsErr);
      }
    }

    // ── GasBack: every paid order earns GP (2% back, max 500 GP/order) ──
    if (!order.pointsEarned && order.buyerId && expectedNaira > 0) {
      const earnRef = adminDb.collection('users').doc(order.buyerId);
      const earnLogRef = adminDb.collection('pointsTransactions').doc();
      try {
        await adminDb.runTransaction(async (tx) => {
          const oSnap = await tx.get(orderRef);
          if (oSnap.data()?.pointsEarned) return;
          const earn = Math.min(500, Math.floor(expectedNaira * 0.02));
          tx.update(orderRef, { pointsEarned: true, pointsEarnedCount: earn });
          if (earn <= 0) return;
          const uSnap = await tx.get(earnRef);
          const bal = Math.max(0, Math.floor(Number(uSnap.data()?.gasPoints) || 0));
          tx.set(earnRef, { gasPoints: bal + earn }, { merge: true });
          tx.set(earnLogRef, {
            uid: order.buyerId,
            type: 'earn',
            points: earn,
            reason: 'order_cashback',
            orderId: resolvedOrderId,
            createdAt: new Date(),
          });
        });
      } catch (earnErr) {
        // Payment is already confirmed — never fail the order over points.
        console.error('GasBack failed (payment still valid):', earnErr);
      }
    }

    await notifyPaidEscrow(resolvedOrderId);
    await postSystemMessage(resolvedOrderId, 'Chat is open. Payment is locked in escrow until Door Code or buyer confirm.');

    // SMS buyer + seller via Termii (payment confirmed = order placed)
    try {
      const sellerId = order.sellerId || order.vendorId || order.shopId;
      let sellerPhone: string | undefined;
      let sellerName: string | undefined = order.sellerName || order.vendorName || order.shopName;
      if (sellerId) {
        const vSnap = await adminDb.collection('vendors').doc(String(sellerId)).get();
        if (vSnap.exists) {
          const vd: any = vSnap.data()!;
          sellerPhone = vd.phone || vd.phoneNumber || vd.whatsapp;
          sellerName = sellerName || vd.businessName || vd.name;
        }
      }
      const buyerPhone = order.buyerPhone || order.customerPhone || order.phone;
      const kg = Number(order.kg || order.kilograms || 0);
      const total = Number(order.total || order.totalAmount || (paidKobo ? paidKobo / 100 : 0) || 0);
      await notifyOrderEvent(
        { id: resolvedOrderId, buyerPhone, sellerPhone, sellerName, kg, total },
        'placed'
      );
    } catch (smsErr) {
      console.error('placed SMS failed:', smsErr);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }
}
