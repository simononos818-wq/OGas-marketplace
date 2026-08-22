import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';
import { doorCodesMatch } from '../../../lib/door-code';
import { paySellerFromEscrow } from '../../../lib/escrow';
import { postSystemMessage } from '../../../lib/chat-server';
import { SYSTEM_COPY } from '../../../lib/chat';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    }

    const { orderId, action, doorCode } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Missing order' }, { status: 400 });
    }

    const orderSnap = await adminDb.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    const order = orderSnap.data()!;

    if (order.escrowStatus === 'cod' || order.paymentMethod === 'cash') {
      if (order.buyerId !== user.uid && order.sellerId !== user.uid) {
        return NextResponse.json({ success: false, message: 'Not your order' }, { status: 403 });
      }
      await adminDb.collection('orders').doc(orderId).update({
        status: 'completed',
        escrowStatus: 'cod_done',
        releasedBy: order.buyerId === user.uid ? 'buyer' : 'seller',
        releasedAt: new Date(),
        updatedAt: new Date(),
      });
      await postSystemMessage(orderId, SYSTEM_COPY.cash_done);
      return NextResponse.json({ success: true, message: 'Cash order completed' });
    }

    if (order.paymentStatus !== 'paid' && order.status !== 'paid') {
      return NextResponse.json({ success: false, message: 'Payment is not in escrow yet' }, { status: 400 });
    }

    if (action === 'seller_code') {
      if (order.sellerId !== user.uid) {
        return NextResponse.json({ success: false, message: 'Only the seller can unlock with the Door Code' }, { status: 403 });
      }
      const secretRef = adminDb.collection('orderSecrets').doc(orderId);
      const secretSnap = await secretRef.get();
      const secret = secretSnap.data() || {};
      const lockedUntil = secret.lockedUntil?.toDate?.() || (secret.lockedUntil ? new Date(secret.lockedUntil) : null);
      if (lockedUntil && lockedUntil.getTime() > Date.now()) {
        const mins = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        return NextResponse.json({
          success: false,
          message: `Too many tries. Ask the buyer again in ${mins} min.`,
        }, { status: 429 });
      }
      if (!order.doorCodeHash || !doorCode || !doorCodesMatch(orderId, order.doorCodeHash, doorCode)) {
        const next = (secret.failedAttempts || 0) + 1;
        const patch: Record<string, unknown> = { failedAttempts: next };
        if (next >= MAX_ATTEMPTS) patch.lockedUntil = new Date(Date.now() + LOCK_MS);
        await secretRef.set(patch, { merge: true });
        return NextResponse.json({
          success: false,
          message: next >= MAX_ATTEMPTS
            ? 'Door Code locked after 5 tries. Ask the buyer and wait 15 minutes.'
            : 'Door Code does not match. Ask the buyer at the door.',
        }, { status: 400 });
      }
      await secretRef.set({ failedAttempts: 0, lockedUntil: null }, { merge: true });
      const result = await paySellerFromEscrow(orderId, 'seller_code');
      return NextResponse.json({ success: true, ...result });
    }

    if (order.buyerId !== user.uid) {
      return NextResponse.json({ success: false, message: 'Only the buyer can confirm receipt' }, { status: 403 });
    }
    const result = await paySellerFromEscrow(orderId, 'buyer');
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('release-escrow', error);
    return NextResponse.json({ success: false, message: error.message || 'Could not release escrow' }, { status: 500 });
  }
}
