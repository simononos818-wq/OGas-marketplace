import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Seller self-service settings: delivery fee (0 = free delivery).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const fee = Math.max(0, Math.min(5000, Math.floor(Number(body.deliveryFee) || 0)));
    const sellerRef = adminDb.collection('sellers').doc(user.uid);
    const snap = await sellerRef.get();
    if (!snap.exists) return NextResponse.json({ success: false, message: 'Seller profile not found' }, { status: 404 });
    await sellerRef.set({ deliveryFee: fee, updatedAt: new Date() }, { merge: true });
    return NextResponse.json({ success: true, deliveryFee: fee });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
