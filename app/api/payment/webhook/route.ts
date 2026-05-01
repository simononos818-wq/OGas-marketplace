import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 401 
});
    }

    const hash = crypto.createHmac('sha512', 
process.env.PAYSTACK_SECRET_KEY!).update(body).digest('hex');
    
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 
401 });
    }

    const event = JSON.parse(body);
    
    if (event.event === 'charge.success') {
      const { reference, amount, customer, metadata } = event.data;
      console.log('Payment success:', reference, amount / 100);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
