import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, email, name } = await req.json();
    
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, message: 'Payment not configured' },
        { status: 500 }
      );
    }

    const reference = `OGAS-${orderId}-${Date.now()}`;
    
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || 'customer@ogas.com',
        amount: Math.round(amount * 100), // Paystack uses kobo
        reference,
        metadata: { orderId, buyerName: name },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ogaslpgmarketplace.com'}/orders?ref=${orderId}&status=paid`,
      }),
    });

    const data = await res.json();
    
    if (data.status && data.data?.authorization_url) {
      return NextResponse.json({ 
        success: true, 
        authorization_url: data.data.authorization_url,
        reference 
      });
    }
    
    return NextResponse.json(
      { success: false, message: data.message || 'Payment failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Try again.' },
      { status: 500 }
    );
  }
}
