import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';
    const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(body).digest('hex');
    if (hash !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    const event = JSON.parse(body);
    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      if (metadata?.orderId) await updateDoc(doc(db, 'orders', metadata.orderId), { paymentStatus: 'paid', orderStatus: 'confirmed', paystackReference: reference });
    }
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: 'Webhook failed' }, { status: 500 }); }
}
