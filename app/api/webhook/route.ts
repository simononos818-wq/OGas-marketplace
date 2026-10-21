import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { adminDb } from '../../../lib/firebase-admin';
import { notifyPaidEscrow } from '../../../lib/escrow';
import { postSystemMessage } from '../../../lib/chat-server';
import { notifyOrderEvent } from '../../../lib/notify';

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
    if (signature) {
      const hash = createHmac('sha512', secret).update(rawBody).digest('hex');
      try {
        const a = Buffer.from(hash, 'hex');
        const b = Buffer.from(String(signature), 'hex');
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          console.error('webhook bad signature');
          return NextResponse.json({ ok: false }, { status: 401 });
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

    // If Gas Points were applied at checkout, the expected amount is the
    // reduced chargedAmount, not the full order total.
    const expectedNaira = Number(
      order.chargedAmount ?? order.totalAmount ?? order.total ?? order.totalPrice ?? 0,
    );
    if (expectedNaira > 0 && Math.abs(paidKobo - Math.round(expectedNaira * 100)) > 100) {
      console.error('webhook amount mismatch', { orderId: resolvedOrderId, paidKobo, expectedNaira });
      return NextResponse.json({ received: true, skipped: 'amount_mismatch' });
    }

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
    return NextResponse.json({ received: true, error: 'logged' });
  }
}
