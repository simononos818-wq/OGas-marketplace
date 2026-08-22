export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';
import { formatDoorCode } from '../../../lib/door-code';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
  }
  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json({ success: false, message: 'Missing order' }, { status: 400 });
  }

  const orderSnap = await adminDb.collection('orders').doc(orderId).get();
  if (!orderSnap.exists) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }
  const order = orderSnap.data()!;
  if (order.buyerId !== user.uid) {
    return NextResponse.json({ success: false, message: 'Not your order' }, { status: 403 });
  }
  if (order.escrowStatus === 'released' || order.status === 'completed') {
    return NextResponse.json({ success: true, doorCode: null, released: true });
  }

  const secret = await adminDb.collection('orderSecrets').doc(orderId).get();
  const code = secret.data()?.doorCode;
  return NextResponse.json({
    success: true,
    doorCode: code ? formatDoorCode(code) : null,
    escrowStatus: order.escrowStatus || null,
  });
}
