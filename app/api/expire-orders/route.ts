import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazily expire unpaid orders past their payment window (no cron on Spark plan).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const orderIds: string[] = Array.isArray(body.orderIds) ? body.orderIds.slice(0, 50) : [];
    const now = Date.now();
    let expiredCount = 0;
    for (const id of orderIds) {
      try {
        const ref = adminDb.collection('orders').doc(id);
        const snap = await ref.get();
        if (!snap.exists) continue;
        const o: any = snap.data();
        if (o.paymentStatus !== 'pending' || o.status !== 'pending_payment') continue;
        const ts = o.expiresAt?.toMillis ? o.expiresAt.toMillis() : o.expiresAt ? new Date(o.expiresAt).getTime() : null;
        const stale = ts ? ts < now : (o.updatedAt?.toMillis?.() || new Date(o.updatedAt || 0).getTime()) < now - 30 * 60 * 1000;
        if (!stale) continue;
        await ref.update({ status: 'expired', paymentStatus: 'expired', escrowStatus: 'expired', expiredAt: new Date(), updatedAt: new Date() });
        expiredCount += 1;
      } catch (e) { console.error('expire failed for', id, e); }
    }
    return NextResponse.json({ success: true, expired: expiredCount });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
