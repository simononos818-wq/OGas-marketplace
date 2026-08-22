import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';
import { markChatRead, openOrderChat, sendChatMessage } from '../../../lib/chat-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action as string;

    if (action === 'open') {
      const orderId = String(body.orderId || body.chatId || '');
      if (!orderId) {
        return NextResponse.json({ success: false, message: 'Missing order' }, { status: 400 });
      }
      const orderSnap = await adminDb.collection('orders').doc(orderId).get();
      if (!orderSnap.exists) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      }
      const order = orderSnap.data()!;
      if (order.buyerId !== user.uid && order.sellerId !== user.uid) {
        return NextResponse.json({ success: false, message: 'Not your order' }, { status: 403 });
      }
      const opened = await openOrderChat({ id: orderId, ...(order as any) });
      return NextResponse.json({ success: true, ...opened });
    }

    if (action === 'read') {
      const chatId = String(body.chatId || body.orderId || '');
      if (!chatId) {
        return NextResponse.json({ success: false, message: 'Missing chat' }, { status: 400 });
      }
      await markChatRead(user.uid, chatId);
      return NextResponse.json({ success: true });
    }

    if (action === 'send') {
      const chatId = String(body.chatId || body.orderId || '');
      const result = await sendChatMessage({
        uid: user.uid,
        chatId,
        text: body.text,
        quickKey: body.quickKey,
      });
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    const message = error?.message || 'Could not send';
    const status = /not your|not found/i.test(message) ? 403 : 400;
    return NextResponse.json({ success: false, message }, { status });
  }
}
