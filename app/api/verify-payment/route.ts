import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { reference, orderId } = await req.json();
    
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false, message: 'Not configured' }, { status: 500 });
    }

    // Verify with Paystack
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    
    const data = await res.json();
    
    if (data.status && data.data?.status === 'success') {
      // Update order in Firestore
      await adminDb.collection('orders').doc(orderId).update({
        status: 'paid',
        paymentStatus: 'paid',
        paystackRef: reference,
        paidAt: new Date(),
        verifiedAt: new Date(),
      });
      return NextResponse.json({ success: true, message: 'Payment verified' });
    }
    
    return NextResponse.json({ success: false, message: 'Payment not verified' }, { status: 400 });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
