import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { reference, orderId } = await req.json();
    
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false, message: 'Not configured' }, { status: 500 });
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    
    const data = await res.json();
    
    if (data.status && data.data?.status === 'success') {
      const resolvedOrderId = orderId || data.data?.metadata?.orderId;
      
      if (!resolvedOrderId) {
        console.warn('Payment verified but no orderId found. Ref:', reference);
        return NextResponse.json({ success: true, message: 'Payment verified but order not linked' });
      }

      await adminDb.collection('orders').doc(resolvedOrderId).update({
        status: 'paid',
        paymentStatus: 'paid',
        paystackRef: reference,
        paystackAmount: data.data.amount,
        customerEmail: data.data.customer?.email || null,
        paidAt: new Date(),
        verifiedAt: new Date(),
        verifiedViaApi: true,
      });
      
      console.log(`Order ${resolvedOrderId} verified and marked paid ✅`);
      return NextResponse.json({ success: true, message: 'Payment verified', orderId: resolvedOrderId });
    }
    
    return NextResponse.json({ success: false, message: 'Payment not verified' }, { status: 400 });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
