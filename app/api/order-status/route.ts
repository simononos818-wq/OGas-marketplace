import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';
import { postSystemMessage } from '../../../lib/chat-server';

const SELLER_NEXT: Record<string, string> = {
  paid: 'confirmed',
  pending_cash: 'confirmed',
  confirmed: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
  }
  const { orderId, status } = await req.json();
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
  const allowed = SELLER_NEXT[order.status];
  if (allowed !== status) {
    return NextResponse.json({ success: false, message: 'Invalid status change' }, { status: 400 });
  }

  await snap.ref.update({ status, updatedAt: new Date() });
  await postSystemMessage(orderId, status);
  return NextResponse.json({ success: true });
}
