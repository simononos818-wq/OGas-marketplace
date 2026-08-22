import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/require-user';
import { hashDoorCode, makeDoorCode, formatDoorCode } from '../../../lib/door-code';
import { sendSms } from '../../../lib/sms';
import { openOrderChat } from '../../../lib/chat-server';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Sign in required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      sellerId,
      kg,
      deliveryType,
      paymentMethod,
      buyerPhone,
      buyerName,
      buyerAddress,
      quantity,
    } = body;

    const phone = String(buyerPhone || '').trim();
    if (!sellerId || !phone || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });
    }

    const sellerSnap = await adminDb.collection('sellers').doc(sellerId).get();
    if (!sellerSnap.exists) {
      return NextResponse.json({ success: false, message: 'Seller not found' }, { status: 404 });
    }
    const seller = sellerSnap.data()!;
    if (seller.isApproved === false) {
      return NextResponse.json({ success: false, message: 'This store cannot take orders yet' }, { status: 400 });
    }

    const size = Number(kg) || 12.5;
    const qty = Number(quantity) || 1;
    const original = Number(seller.pricePerKg) || 0;
    if (!original) {
      return NextResponse.json({ success: false, message: 'Seller has not set a price' }, { status: 400 });
    }
    const discounted = Math.max(original - 50, 0);
    const deliveryFee = deliveryType === 'pickup' ? 0 : Number(seller.deliveryFee || 500);
    const gasCost = discounted * size * qty;
    const totalAmount = gasCost + deliveryFee;
    const method = paymentMethod === 'cash' ? 'cash' : 'paystack';
    const isCash = method === 'cash';

    const userRef = adminDb.collection('users').doc(user.uid);
    await userRef.set(
      {
        phone,
        name: buyerName || '',
        lastAddress: buyerAddress || '',
        updatedAt: new Date(),
      },
      { merge: true },
    );

    const orderRef = adminDb.collection('orders').doc();
    const orderId = orderRef.id;
    const doorCode = isCash ? null : makeDoorCode();
    const doorCodeHash = doorCode ? hashDoorCode(orderId, doorCode) : null;

    await orderRef.set({
      buyerId: user.uid,
      buyerName: buyerName || '',
      buyerPhone: phone,
      buyerEmail: user.email || '',
      buyerAddress: buyerAddress || '',
      sellerId,
      sellerName: seller.businessName || 'Unknown Seller',
      sellerPhone: seller.phone || '',
      items: [{ size: String(size), quantity: qty, unitPrice: discounted }],
      gasSize: String(size),
      quantity: qty,
      pricePerKg: discounted,
      deliveryType: deliveryType === 'pickup' ? 'pickup' : 'delivery',
      deliveryFee,
      total: totalAmount,
      totalAmount,
      totalPrice: totalAmount,
      paymentMethod: method,
      status: isCash ? 'pending_cash' : 'pending_payment',
      paymentStatus: isCash ? 'cod' : 'pending',
      escrowStatus: isCash ? 'cod' : 'pending',
      doorCodeHash,
      usedSplitPayment: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (doorCode) {
      await adminDb.collection('orderSecrets').doc(orderId).set({
        buyerId: user.uid,
        doorCode,
        createdAt: new Date(),
      });
    }

    await openOrderChat({
      id: orderId,
      buyerId: user.uid,
      sellerId,
      buyerName: buyerName || '',
      sellerName: seller.businessName || 'Unknown Seller',
      buyerPhone: phone,
      sellerPhone: seller.phone || '',
      gasSize: String(size),
      quantity: qty,
    });

    if (isCash) {
      await sendSms(
        phone,
        `OGas: cash order #${orderId.slice(-6).toUpperCase()} placed. Pay when you collect your gas.`,
      );
      if (seller.phone) {
        await sendSms(
          seller.phone,
          `OGas: cash order #${orderId.slice(-6).toUpperCase()} from ${phone}. ${size}kg.`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      totalAmount,
      doorCode: doorCode ? formatDoorCode(doorCode) : null,
    });
  } catch (error) {
    console.error('create-order', error);
    return NextResponse.json({ success: false, message: 'Could not place order' }, { status: 500 });
  }
}
