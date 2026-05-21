import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, address, kgSize, name, sellerPhone } = await request.json();
    
    const message = `🔥 NEW OGAS ORDER 🔥%0A%0ACustomer: ${encodeURIComponent(name)}%0APhone: ${phone}%0AAddress: ${encodeURIComponent(address)}%0ASize: ${kgSize}kg%0A%0AReply CONFIRM to accept.`;
    
    const whatsappUrl = `https://wa.me/234${sellerPhone?.replace(/^0/, '')}?text=${message}`;
    
    console.log('WhatsApp order:', { phone, address, kgSize, name, sellerPhone });

    return NextResponse.json({ 
      success: true, 
      message: 'Order received. Opening WhatsApp...',
      whatsappUrl,
      fallback: true
    });
  } catch (error) {
    console.error('WhatsApp order error:', error);
    return NextResponse.json({ success: false, message: 'Failed. Please call directly.' }, { status: 500 });
  }
}
