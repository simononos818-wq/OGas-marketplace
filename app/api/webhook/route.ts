import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Webhook received:', body);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
  }
}
