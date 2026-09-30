import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';
import { postSystemMessage } from '../../../lib/chat-server';

// Walk-in-first: from 'confirmed' a seller may go straight to 'delivered'
// (weigh & fill at the station) or via 'out_for_delivery' if they deliver.
const SELLER_NEXT: Record<string, string[]> = {
  paid: ['confirmed'],
  pending_cash: ['confirmed'],
  confirmed: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
};

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
  }
  const { orderId, status, kgDelivered } = await req.json();
  if (!orderId || !status) {
    return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
  }
  if (status === 'completed') {
    return NextResponse.json({
      success: false,
      message: 'Use the Door Code to complete a paid order.',
    }, { status: 400 });
  }

  const snap = await adminDb.collection('orders').doc(orderId).get();
  if (!snap.exists) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }
  const order = snap.data()!;
  if (order.sellerId !== user.uid) {
    return NextResponse.json({ success: false, message: 'Not your order' }, { status: 403 });
  }
  const allowed = SELLER_NEXT[order.status] || [];
  if (!allowed.includes(status)) {
    return NextResponse.json({ success: false, message: 'Invalid status change' }, { status: 400 });
  }

  const update: Record<string, unknown> = { status, updatedAt: new Date() };

  // WEIGHED RECEIPT: delivery is only marked after the seller enters the kg on the scale
  if (status === 'delivered') {
    const kg = Number(kgDelivered);
    if (!kg || kg <= 0 || kg > 100) {
      return NextResponse.json({
        success: false,
        message: 'Enter the kg shown on your scale (e.g. 12.5)',
      }, { status: 400 });
    }
    update.kgDelivered = kg;
    update.weighedAt = new Date();
    update.deliveredAt = new Date();
    update.autoCompleteAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  }

  await snap.ref.update(update);
  await postSystemMessage(orderId, status);
  return NextResponse.json({ success: true });
}
