import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';
import { formatDoorCode } from './door-code';
import { sendSms } from './sms';
import { postSystemMessage } from './chat-server';
import { SYSTEM_COPY } from './chat';

export const OGAS_COMMISSION_PERCENT = 10;

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

async function paystackJson(path: string, secret: string, body: object) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function paySellerFromEscrow(orderId: string, releasedBy: string) {
  const orderRef = adminDb.collection('orders').doc(orderId);

  const claimed = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) throw new Error('Order not found');
    const order = snap.data()!;
    if (order.escrowStatus === 'released' || order.escrowStatus === 'releasing') {
      return { already: true as const, order };
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
    return { already: true, sellerEarnings: claimed.order.sellerEarnings || 0, payoutStatus: claimed.order.payoutStatus || 'sent' };
  }

  const order = claimed.order;
  const totalNaira = Number(order.totalAmount || order.total || order.totalPrice || 0);
  const commission = Math.round(totalNaira * (OGAS_COMMISSION_PERCENT / 100));
  const sellerEarnings = Math.max(totalNaira - commission, 0);

  let payoutStatus = 'pending';
  let transferRef: string | null = null;
  const sellerRef = order.sellerId ? adminDb.collection('sellers').doc(order.sellerId) : null;
  const sellerSnap = sellerRef ? await sellerRef.get() : null;
  const seller = sellerSnap?.data() || {};

  const secret = process.env.PAYSTACK_SECRET_KEY;
  const accountNumber = seller.accountNumber || seller.bankAccountNumber;
  const bankCode = seller.bankCode;
  const accountName = seller.accountName || seller.businessName || 'OGas Seller';

  if (secret && accountNumber && bankCode && sellerEarnings >= 100) {
    try {
      let recipient = seller.paystackRecipientCode as string | undefined;
      if (!recipient) {
        const rec = await paystackJson('/transferrecipient', secret, {
          type: 'nuban',
          name: accountName,
          account_number: String(accountNumber),
          bank_code: String(bankCode),
          currency: 'NGN',
        });
        recipient = rec?.data?.recipient_code;
        if (recipient && sellerRef) {
          await sellerRef.set({ paystackRecipientCode: recipient }, { merge: true });
        }
      }
      if (recipient) {
        const t = await paystackJson('/transfer', secret, {
          source: 'balance',
          amount: Math.round(sellerEarnings * 100),
          recipient,
          reason: `OGas order ${orderId.slice(-6)}`,
          reference: `OGAS-PAYOUT-${orderId}`,
        });
        if (t.status) {
          payoutStatus = 'sent';
          transferRef = t.data?.reference || t.data?.transfer_code || null;
        } else {
          console.error('Paystack transfer failed', t);
          payoutStatus = t.message?.toLowerCase?.().includes('duplicate') ? 'sent' : 'pending_manual';
        }
      } else {
        payoutStatus = 'pending_manual';
      }
    } catch (err) {
      console.error('Payout error', err);
      payoutStatus = 'pending_manual';
    }
  } else {
    payoutStatus = 'awaiting_bank';
  }

  await orderRef.update({
    status: 'completed',
    escrowStatus: 'released',
    payoutStatus,
    transferRef,
    commission,
    sellerEarnings,
    releasedBy,
    releasedAt: new Date(),
    buyerConfirmed: releasedBy === 'buyer',
    updatedAt: new Date(),
  });

  await adminDb.collection('orderSecrets').doc(orderId).set(
    { doorCode: null, releasedAt: new Date(), failedAttempts: 0, lockedUntil: null },
    { merge: true },
  );

  if (sellerRef) {
    await sellerRef.set(
      {
        totalEarnings: FieldValue.increment(sellerEarnings),
        pendingPayout:
          payoutStatus === 'sent'
            ? FieldValue.increment(0)
            : FieldValue.increment(sellerEarnings),
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
  const sellerPhone = order.sellerPhone || seller.phone;
  if (sellerPhone) {
    await sendSms(
      sellerPhone,
      payoutStatus === 'sent'
        ? `OGas: Door Code matched. N${sellerEarnings} for order #${shortId} is on the way to your bank.`
        : `OGas: Order #${shortId} confirmed. N${sellerEarnings} is ready — add your payout account if you have not.`,
    );
  }

  await postSystemMessage(orderId, SYSTEM_COPY.released);

  return { already: false, sellerEarnings, payoutStatus };
}
