import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireUser } from '@/lib/require-user';
import { sendSms } from '@/lib/sms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = ['simononos818@gmail.com'];

const DEFAULT_MESSAGE =
  'OGas: Good news! Your store registration is almost done. Open the OGas app, complete your setup and start receiving gas orders today. Need help? Call/WhatsApp 0915 909 0953.';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    }

    // Admin check: email allowlist or users/{uid}.role == 'admin'
    let isAdmin = ADMIN_EMAILS.includes(user.email || '');
    if (!isAdmin) {
      const uSnap = await adminDb.collection('users').doc(user.uid).get();
      isAdmin = uSnap.data()?.role === 'admin';
    }
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Admins only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const target = (body.target as string) || 'pending';
    const message = (body.message as string)?.trim() || DEFAULT_MESSAGE;
    if (message.length > 450) {
      return NextResponse.json({ success: false, message: 'Message too long (max 450 chars)' }, { status: 400 });
    }

    const sellersSnap = await adminDb.collection('sellers').get();

    const recipients: { id: string; phone: string; name: string }[] = [];
    for (const d of sellersSnap.docs) {
      const s = d.data();
      const approved = s.isApproved === true || s.sellerStatus === 'approved';
      const rejected = s.sellerStatus === 'rejected';
      const hasBank = Boolean(s.bankDetails?.accountNumber || s.bankDetails?.recipientCode);

      // pending: not approved and not rejected
      // no_bank: approved but payout account missing
      const include =
        target === 'all'
          ? !rejected
          : target === 'no_bank'
            ? approved && !hasBank
            : !approved && !rejected;
      if (!include) continue;

      // Phone: prefer seller doc, fall back to the user doc
      let phone = String(s.phone || s.ownerPhone || '').trim();
      if (!phone) {
        try {
          const uSnap = await adminDb.collection('users').doc(d.id).get();
          phone = String(uSnap.data()?.phone || '').trim();
        } catch { /* ignore */ }
      }
      if (!phone) continue;
      recipients.push({ id: d.id, phone, name: s.businessName || 'Store' });
    }

    let sent = 0;
    let failed = 0;
    for (const r of recipients) {
      const res = await sendSms(r.phone, message);
      if (res.sent) sent++; else failed++;

      // In-app notification too, so the message lives inside OGas
      try {
        await adminDb.collection('notifications').add({
          userId: r.id,
          title: 'Complete your OGas store setup',
          body: message,
          type: 'admin_broadcast',
          read: false,
          createdAt: new Date(),
        });
      } catch { /* non-fatal */ }

      // Be gentle with the SMS provider
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    return NextResponse.json({
      success: true,
      target,
      targeted: recipients.length,
      sent,
      failed,
      noPhone: 0,
    });
  } catch (error) {
    console.error('notify-sellers error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
