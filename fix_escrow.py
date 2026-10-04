import sys

p1 = '/Users/mac/o-gas-marketplace-live/app/api/order-status/route.ts'
with open(p1) as f:
    s1 = f.read()

if 'autoCompleteAt' not in s1:
    old1 = "    update.kgDelivered = kg;\n    update.weighedAt = new Date();"
    new1 = "    update.kgDelivered = kg;\n    update.weighedAt = new Date();\n    update.deliveredAt = new Date();\n    update.autoCompleteAt = new Date(Date.now() + 2 * 60 * 60 * 1000);"
    if old1 in s1:
        s1 = s1.replace(old1, new1)
        with open(p1, 'w') as f:
            f.write(s1)
        print('order-status: OK')
    else:
        print('order-status: pattern not found')
else:
    print('order-status: already patched')

p2 = '/Users/mac/o-gas-marketplace-live/app/api/release-escrow/route.ts'
with open(p2) as f:
    s2 = f.read()

if 'seller_force_complete' not in s2:
    old2 = """    if (order.buyerId !== user.uid) {
      return NextResponse.json({ success: false, message: 'Only the buyer can confirm receipt' }, { status: 403 });
    }
    const result = await paySellerFromEscrow(orderId, 'buyer');
    return NextResponse.json({ success: true, ...result });"""
    new2 = """    if (action === 'seller_force_complete') {
      if (order.sellerId !== user.uid) {
        return NextResponse.json({ success: false, message: 'Only the seller can force-complete' }, { status: 403 });
      }
      if (order.status !== 'delivered') {
        return NextResponse.json({ success: false, message: 'Order must be delivered first' }, { status: 400 });
      }
      const autoCompleteAt = order.autoCompleteAt?.toDate?.() || (order.autoCompleteAt ? new Date(order.autoCompleteAt) : null);
      if (autoCompleteAt && autoCompleteAt.getTime() > Date.now()) {
        const mins = Math.ceil((autoCompleteAt.getTime() - Date.now()) / 60000);
        return NextResponse.json({ success: false, message: 'Wait ' + mins + ' min or ask buyer for Door Code' }, { status: 429 });
      }
      await adminDb.collection('orders').doc(orderId).update({ status: 'completed', forceCompletedAt: new Date(), updatedAt: new Date() });
      const result = await paySellerFromEscrow(orderId, 'seller_force_complete');
      return NextResponse.json({ success: true, ...result });
    }

    if (order.buyerId !== user.uid) {
      return NextResponse.json({ success: false, message: 'Only the buyer can confirm receipt' }, { status: 403 });
    }
    const result = await paySellerFromEscrow(orderId, 'buyer');
    return NextResponse.json({ success: true, ...result });"""
    if old2 in s2:
        s2 = s2.replace(old2, new2)
        with open(p2, 'w') as f:
            f.write(s2)
        print('release-escrow: OK')
    else:
        print('release-escrow: pattern not found')
else:
    print('release-escrow: already patched')
