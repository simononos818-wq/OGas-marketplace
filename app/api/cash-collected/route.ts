import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Seller marks the cash balance of a split order as collected at the door.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const orderId = String(body.orderId || '');
    if (!orderId) return NextResponse.json({ success: false, message: 'Missing orderId' }, { status: 400 });

    const ref = adminDb.collection('orders').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    const order: any = snap.data();
    if (order.sellerId !== user.uid) return NextResponse.json({ success: false, message: 'Not your order' }, { status: 403 });
    if (!(Number(order.cashBalance) > 0)) return NextResponse.json({ success: false, message: 'No cash balance on this order' }, { status: 400 });
    if (order.cashCollected) return NextResponse.json({ success: true, already: true });

    await ref.update({ cashCollected: true, cashCollectedAt: new Date(), updatedAt: new Date() });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
