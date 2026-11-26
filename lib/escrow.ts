import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';
import { formatDoorCode } from './door-code';
import { sendSms } from './sms';
import { postSystemMessage } from './chat-server';
import { SYSTEM_COPY } from './chat';

// ─────────────────────────────────────────────────────────────────────────────
// THE ONE NUMBER. OGas commission is 5% on card (escrow-held) orders, locked
// at order creation and never recomputed. Cash orders: 0%, forever.
// No grace window. No other rate may exist anywhere in the codebase.
// Ruling: Simon, 2026-11-23 — supersedes every 2% and 10% version.
// ─────────────────────────────────────────────────────────────────────────────
export const OGAS_COMMISSION_PERCENT = 5;

// OGas absorbs the Paystack card fee out of its own commission, so the buyer
// pays exactly the order amount and the seller receives 95% clean.
// Estimate for accounting: 1.5% (+₦100 above ₦2,500), capped at ₦2,000.
export function estimatePaystackFeeNaira(onlineNaira: number): number {
  const amt = Math.max(0, Math.round(Number(onlineNaira) || 0));
  if (amt <= 0) return 0;
  const pct = Math.round(amt * 0.015);
  return Math.min(amt <= 2500 ? pct : pct + 100, 2000);
}

// DEPRECATED 2026-11-23: the 90-day grace window is gone. This shim exists only
// so older imports keep working — it always returns the one number.
export function commissionPercentForSeller(_seller: any): number {
  return OGAS_COMMISSION_PERCENT;
}

export async function notifyPaidEscrow(orderId: string) {
  const orderSnap = await adminDb.collection('orders').doc(orderId).get();
  if (!orderSnap.exists) return;
  const order = orderSnap.data()!;
  const secretSnap = await adminDb.collection('orderSecrets').doc(orderId).get();
  const doorCode = secretSnap.data()?.doorCode as string | undefined;
  const shortId = orderId.slice(-6).toUpperCase();

  if (order.buyerPhone && doorCode) {
    await sendSms(
      order.buyerPhone,
      `OGas: payment locked in escrow for order #${shortId}. Door Code ${formatDoorCode(doorCode)}. Share it only when the cylinder is in your hands. We never auto-release.`,
    );
  }

  const sellerPhone = order.sellerPhone || (await sellerPhoneFor(order.sellerId));
  if (sellerPhone) {
    await sendSms(
      sellerPhone,
      `OGas: new paid order #${shortId}. Money is in escrow. Ask the buyer for the Door Code at the door to get paid.`,
    );
  }
}

async function sellerPhoneFor(sellerId?: string) {
  if (!sellerId) return null;
  const snap = await adminDb.collection('sellers').doc(sellerId).get();
  return (snap.data()?.phone as string | undefined) || null;
}

// AUTO-PAYOUT IS OFF (ruling 2026-11-23). No automatic escrow→bank transfer
// runs anywhere until split payments / instant settlement ship. Interim is
// pay-on-collection: the release is recorded here, settlement is manual.
export async function paySellerFromEscrow(orderId: string, releasedBy: string) {
  const orderRef = adminDb.collection('orders').doc(orderId);

  const claimed = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) throw new Error('Order not found');
    const order = snap.data()!;
    if (order.escrowStatus === 'released' || order.escrowStatus === 'releasing') {
      return { already: true as const, order };
    }
    if (order.status !== 'delivered') {
      throw new Error('Order must be delivered before escrow can be released');
    }
    if (order.disputeStatus === 'open' || order.disputed === true || order.cancelledAt) {
      throw new Error('This order is disputed or cancelled and cannot be released');
    }
    if (order.paymentStatus !== 'paid' && order.status !== 'paid') {
      throw new Error('Payment is not in escrow yet');
    }
    tx.update(orderRef, {
      escrowStatus: 'releasing',
      updatedAt: new Date(),
    });
    return { already: false as const, order };
  });

  if (claimed.already) {
    return { already: true, sellerEarnings: claimed.order.sellerEarnings || 0, payoutStatus: claimed.order.payoutStatus || 'pay_on_collection' };
  }

  const order = claimed.order;
  const orderTotalNaira = Number(order.totalAmount || order.total || order.totalPrice || 0);
  const totalNaira = order.paymentMethod === 'split' && Number(order.onlineAmount) > 0
    ? Number(order.onlineAmount)
    : orderTotalNaira;
  const commission = Number(order.ogasCommission ?? order.platformFee ?? 0);
  const sellerEarnings = Math.max(totalNaira - commission, 0);
  const ogasFeeAbsorbed = estimatePaystackFeeNaira(totalNaira);
  const ogasNet = Math.max(commission - ogasFeeAbsorbed, 0);
  const payoutStatus = 'pay_on_collection';
  const releasedAt = new Date();
  const releaseRole = releasedBy === 'buyer' ? 'buyer' : 'seller';

  await orderRef.update({
    status: 'completed',
    statusChangedBy: releasedBy,
    statusChangedAt: releasedAt,
    statusHistory: FieldValue.arrayUnion({
      status: 'completed',
      by: releasedBy,
      role: releaseRole,
      at: releasedAt,
    }),
    escrowStatus: 'released',
    payoutStatus,
    transferRef: null,
    commission,
    sellerEarnings,
    ogasFeeAbsorbed,
    ogasNet,
    releasedBy,
    releasedAt,
    buyerConfirmed: releasedBy === 'buyer',
    updatedAt: releasedAt,
  });

  await adminDb.collection('orderSecrets').doc(orderId).set(
    { doorCode: null, releasedAt: new Date(), failedAttempts: 0, lockedUntil: null },
    { merge: true },
  );

  const sellerRef = order.sellerId ? adminDb.collection('sellers').doc(order.sellerId) : null;
  if (sellerRef) {
    await sellerRef.set(
      {
        totalEarnings: FieldValue.increment(sellerEarnings),
        pendingPayout: FieldValue.increment(sellerEarnings),
        totalOrders: FieldValue.increment(1),
        updatedAt: new Date(),
      },
      { merge: true },
    );
  }

  const shortId = orderId.slice(-6).toUpperCase();
  if (order.buyerPhone) {
    await sendSms(order.buyerPhone, `OGas: escrow released on order #${shortId}. Thank you.`);
  }
  const sellerSnap = sellerRef ? await sellerRef.get() : null;
  const sellerPhone = order.sellerPhone || sellerSnap?.data()?.phone;
  if (sellerPhone) {
    await sendSms(
      sellerPhone,
      `OGas: order #${shortId} confirmed. N${sellerEarnings.toLocaleString()} recorded as your earnings — pay-on-collection, OGas settles with you directly.`,
    );
  }

  await postSystemMessage(orderId, SYSTEM_COPY.released);

  return { already: false, sellerEarnings, payoutStatus };
}
