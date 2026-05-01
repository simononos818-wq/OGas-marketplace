import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();
    if (!reference) return NextResponse.json({ error: 'Reference required' 
}, { status: 400 });

    const response = await 
fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer 
${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    if (data.status && data.data.status === 'success') {
      return NextResponse.json({ success: true, amount: data.data.amount / 
100, reference: data.data.reference });
    }
    return NextResponse.json({ success: false, message: 'Payment failed' 
}, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
