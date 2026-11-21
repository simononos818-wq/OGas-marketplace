import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Weigh & Fill walk-in sale: seller records an over-the-counter cash refill.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const kg = Number(body.kg);
    const totalAmount = Math.round(Number(body.totalAmount));
    const buyerPhone = String(body.buyerPhone || '').trim();

    if (!kg || kg < 0.05 || kg > 50) return NextResponse.json({ success: false, message: 'Weight must be 0.05kg to 50kg' }, { status: 400 });
    if (!totalAmount || totalAmount < 100) return NextResponse.json({ success: false, message: 'Total must be at least ' + String.fromCharCode(8358) + '100' }, { status: 400 });

    const sellerSnap = await adminDb.collection('sellers').doc(user.uid).get();
    if (!sellerSnap.exists) return NextResponse.json({ success: false, message: 'Seller profile not found' }, { status: 404 });
    const seller: any = sellerSnap.data();

    const orderRef = adminDb.collection('orders').doc();
    const shortId = orderRef.id.slice(-6).toUpperCase();
    const unitPrice = Math.round((totalAmount / kg) * 100) / 100;

    await orderRef.set({
      sellerId: user.uid,
      sellerName: seller.businessName || 'OGas Seller',
      sellerPhone: seller.phone || '',
      buyerId: null,
      buyerName: 'Walk-in customer',
      buyerPhone: buyerPhone || '',
      items: [{ size: String(kg), quantity: 1, unitPrice }],
      gasSize: String(kg),
      quantity: 1,
      pricePerKg: unitPrice,
      deliveryType: 'pickup',
      deliveryFee: 0,
      total: totalAmount,
      totalAmount,
      totalPrice: totalAmount,
      paymentMethod: 'cash',
      status: 'completed',
      paymentStatus: 'cod',
      escrowStatus: 'cod',
      source: 'walkin',
      walkin: true,
      kgDelivered: kg,
      cashCollected: true,
      cashCollectedAt: new Date(),
      platformFee: 0,
      ogasCommission: 0,
      ogasCommissionPercent: 0,
      usedSplitPayment: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, orderId: orderRef.id, shortId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
