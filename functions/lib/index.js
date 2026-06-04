"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWeeklyPayouts = exports.verifySeller = exports.notifyBuyerOrderUpdate = exports.sendSellerWelcomeEmail = exports.notifySellerNewOrder = exports.sendWelcomeEmail = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const firestore_2 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const nodemailer = __importStar(require("nodemailer"));
(0, app_1.initializeApp)();
const db = (0, firestore_2.getFirestore)();
const SENDGRID_API_KEY = (0, params_1.defineString)('SENDGRID_API_KEY');
const FROM_EMAIL = (0, params_1.defineString)('FROM_EMAIL', { default: 'noreply@ogas.com.ng' });
const createTransporter = () => nodemailer.createTransport({
    host: 'smtp.sendgrid.net', port: 587,
    auth: { user: 'apikey', pass: SENDGRID_API_KEY.value() },
});
// 1. WELCOME EMAIL - New buyer signup
exports.sendWelcomeEmail = (0, firestore_1.onDocumentCreated)({
    document: 'users/{userId}', region: 'us-central1',
}, async (event) => {
    var _a;
    const userData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!userData || userData.isSeller)
        return;
    const transporter = createTransporter();
    try {
        await transporter.sendMail({
            from: `OGas Marketplace <${FROM_EMAIL.value()}>`,
            to: userData.email,
            subject: 'Welcome to OGas - Gas Delivered to Your Door! 🔥',
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;"><div style="background:linear-gradient(135deg,#FF5722,#FF8A65);padding:30px;text-align:center;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;font-size:28px;">🔥 Welcome to OGas!</h1><p style="color:white;margin:10px 0 0;font-size:16px;">Gas Delivered, Hassle-Free</p></div><div style="padding:30px;background:#fff;border:1px solid #e0e0e0;border-top:none;"><h2 style="color:#FF5722;margin-top:0;">Hello ${userData.name || 'Valued Customer'},</h2><p>Thank you for joining OGas - Nigeria's trusted LPG marketplace.</p><div style="background:#FFF5EB;padding:20px;border-radius:10px;margin:20px 0;"><h3 style="color:#E64A19;margin-top:0;">What You Can Do:</h3><ul style="line-height:1.8;padding-left:20px;"><li>Browse verified gas sellers near you</li><li>Compare prices and ratings</li><li>Order for delivery or pickup</li><li>Pay securely with card, transfer, or cash</li></ul></div><div style="text-align:center;margin:30px 0;"><a href="https://ogas.com.ng" style="background:#FF5722;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Start Ordering Gas</a></div></div><div style="background:#f5f5f5;padding:20px;text-align:center;border-radius:0 0 12px 12px;font-size:12px;color:#999;"><p>OGas Marketplace | Oteri, Delta State, Nigeria</p></div></div>`
        });
        console.log(`Welcome email sent to ${userData.email}`);
    }
    catch (error) {
        console.error('Failed to send welcome email:', error);
    }
});
// 2. SELLER NOTIFICATION - New order received
exports.notifySellerNewOrder = (0, firestore_1.onDocumentCreated)({
    document: 'orders/{orderId}', region: 'us-central1',
}, async (event) => {
    var _a, _b;
    const orderData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!orderData)
        return;
    const sellerDoc = await db.collection('sellers').doc(orderData.sellerId).get();
    const sellerData = sellerDoc.data();
    if (!sellerData || !sellerData.email)
        return;
    const transporter = createTransporter();
    const orderId = event.params.orderId.slice(-6).toUpperCase();
    try {
        await transporter.sendMail({
            from: `OGas Marketplace <${FROM_EMAIL.value()}>`,
            to: sellerData.email,
            subject: `🔔 New Order #${orderId} - OGas Marketplace`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;"><div style="background:#FF5722;padding:25px;text-align:center;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;font-size:24px;">🔔 New Order Received!</h1></div><div style="padding:30px;background:#fff;border:1px solid #e0e0e0;border-top:none;"><h2 style="color:#333;margin-top:0;">Hello ${sellerData.businessName},</h2><p>You have received a new order. Please confirm it within 30 minutes.</p><div style="background:#f8f8f8;padding:20px;border-radius:10px;margin:20px 0;"><h3 style="color:#FF5722;margin-top:0;">Order Details</h3><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:8px 0;color:#666;">Order ID:</td><td style="padding:8px 0;font-weight:bold;">#${orderId}</td></tr><tr><td style="padding:8px 0;color:#666;">Quantity:</td><td style="padding:8px 0;font-weight:bold;">${orderData.kg} kg</td></tr><tr><td style="padding:8px 0;color:#666;">Total:</td><td style="padding:12px 0;font-weight:bold;color:#FF5722;font-size:18px;">₦${(_b = orderData.totalAmount) === null || _b === void 0 ? void 0 : _b.toLocaleString()}</td></tr></table></div><div style="background:#FFF5EB;padding:15px;border-radius:8px;margin:15px 0;"><p style="margin:0;color:#E64A19;font-size:14px;"><strong>Platform Fee (10%):</strong> ₦${Math.round(orderData.totalAmount * 0.1).toLocaleString()} will be deducted. Your payout: ₦${Math.round(orderData.totalAmount * 0.9).toLocaleString()}</p></div></div></div>`
        });
        await db.collection('notifications').add({
            userId: orderData.sellerId, type: 'new_order', title: 'New Order Received',
            body: `Order #${orderId} - ${orderData.kg}kg gas ordered`, orderId: event.params.orderId,
            read: false, createdAt: new Date(),
        });
        console.log(`Seller notification sent for order ${orderId}`);
    }
    catch (error) {
        console.error('Failed to notify seller:', error);
    }
});
// 3. SELLER WELCOME - After admin verification
exports.sendSellerWelcomeEmail = (0, firestore_1.onDocumentUpdated)({
    document: 'sellers/{sellerId}', region: 'us-central1',
}, async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    if (before.verificationStatus === 'verified' || after.verificationStatus !== 'verified')
        return;
    const transporter = createTransporter();
    const userDoc = await db.collection('users').doc(event.params.sellerId).get();
    const userData = userDoc.data();
    if (!(userData === null || userData === void 0 ? void 0 : userData.email))
        return;
    try {
        await transporter.sendMail({
            from: `OGas Marketplace <${FROM_EMAIL.value()}>`,
            to: userData.email,
            subject: '🎉 Your Seller Account is Verified - Start Selling on OGas!',
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;"><div style="background:linear-gradient(135deg,#00C853,#00E676);padding:30px;text-align:center;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;font-size:28px;">🎉 You're Verified!</h1></div><div style="padding:30px;background:#fff;border:1px solid #e0e0e0;border-top:none;"><h2 style="color:#00C853;margin-top:0;">Hello ${after.businessName},</h2><p>Great news! Your seller account has been verified. You can now start receiving orders.</p><div style="background:#E8F5E9;padding:20px;border-radius:10px;margin:20px 0;"><h3 style="color:#2E7D32;margin-top:0;">Quick Reminders:</h3><ul style="line-height:1.8;padding-left:20px;"><li>Keep your business status <strong>Open</strong> to receive orders</li><li>Confirm orders within 30 minutes</li><li>10% platform fee applies to every order</li><li>Payouts every Monday to your registered bank account</li></ul></div></div></div>`
        });
        console.log(`Seller welcome email sent to ${userData.email}`);
    }
    catch (error) {
        console.error('Failed to send seller welcome email:', error);
    }
});
// 4. ORDER STATUS UPDATE - Notify buyer
exports.notifyBuyerOrderUpdate = (0, firestore_1.onDocumentUpdated)({
    document: 'orders/{orderId}', region: 'us-central1',
}, async (event) => {
    var _a, _b, _c;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after || before.status === after.status)
        return;
    const transporter = createTransporter();
    const orderId = event.params.orderId.slice(-6).toUpperCase();
    const buyerDoc = await db.collection('users').doc(after.buyerId).get();
    const buyerData = buyerDoc.data();
    if (!(buyerData === null || buyerData === void 0 ? void 0 : buyerData.email))
        return;
    const statusMessages = {
        confirmed: { title: 'Order Confirmed! ✅', body: `Your order #${orderId} has been confirmed by ${after.sellerName}.`, color: '#2979FF' },
        out_for_delivery: { title: 'Out for Delivery! 🚚', body: `Your order #${orderId} is on its way!`, color: '#FF5722' },
        delivered: { title: 'Order Delivered! 🎉', body: `Your order #${orderId} has been delivered.`, color: '#00C853' },
        cancelled: { title: 'Order Cancelled', body: `Your order #${orderId} has been cancelled.`, color: '#FF1744' },
    };
    const msg = statusMessages[after.status];
    if (!msg)
        return;
    try {
        await transporter.sendMail({
            from: `OGas Marketplace <${FROM_EMAIL.value()}>`,
            to: buyerData.email,
            subject: `${msg.title} - Order #${orderId}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;"><div style="background:${msg.color};padding:25px;text-align:center;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;font-size:24px;">${msg.title}</h1></div><div style="padding:30px;background:#fff;border:1px solid #e0e0e0;border-top:none;"><p style="font-size:16px;line-height:1.6;">${msg.body}</p><div style="background:#f8f8f8;padding:20px;border-radius:10px;margin:20px 0;"><h3 style="margin-top:0;">Order #${orderId}</h3><p><strong>Seller:</strong> ${after.sellerName}</p><p><strong>Quantity:</strong> ${after.kg} kg</p><p><strong>Total:</strong> ₦${(_c = after.totalAmount) === null || _c === void 0 ? void 0 : _c.toLocaleString()}</p></div></div></div>`
        });
        console.log(`Order status email sent to ${buyerData.email}`);
    }
    catch (error) {
        console.error('Failed to send status update:', error);
    }
});
// 5. ADMIN VERIFY SELLER - Callable function
exports.verifySeller = (0, https_1.onCall)({
    region: 'us-central1',
    authPolicy: async (auth) => {
        var _a;
        if (!auth)
            return false;
        const userDoc = await db.collection('users').doc(auth.uid).get();
        return ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) === 'admin';
    },
}, async (request) => {
    var _a;
    const { sellerId, action, reason } = request.data;
    if (!sellerId || !action)
        throw new https_1.HttpsError('invalid-argument', 'Seller ID and action required');
    if (action === 'verify') {
        await db.collection('sellers').doc(sellerId).update({
            isVerified: true, isActive: true, verificationStatus: 'verified',
            verifiedAt: new Date(), verifiedBy: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid, updatedAt: new Date(),
        });
        return { success: true, message: 'Seller verified' };
    }
    else if (action === 'reject') {
        await db.collection('sellers').doc(sellerId).update({
            isVerified: false, isActive: false, verificationStatus: 'rejected',
            rejectionReason: reason || 'Not specified', rejectedAt: new Date(), updatedAt: new Date(),
        });
        return { success: true, message: 'Seller rejected' };
    }
    throw new https_1.HttpsError('invalid-argument', 'Invalid action');
});
// 6. WEEKLY PAYOUT - Admin only
exports.processWeeklyPayouts = (0, https_1.onCall)({
    region: 'us-central1',
    authPolicy: async (auth) => {
        var _a;
        if (!auth)
            return false;
        const userDoc = await db.collection('users').doc(auth.uid).get();
        return ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) === 'admin';
    },
}, async () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const ordersSnapshot = await db.collection('orders')
        .where('status', '==', 'delivered').where('paymentStatus', '==', 'paid')
        .where('payoutProcessed', '!=', true).where('deliveredAt', '>=', lastWeek).get();
    const sellerEarnings = {};
    ordersSnapshot.forEach((doc) => {
        const order = doc.data();
        const platformFee = order.totalAmount * (order.platformFeeRate || 0.10);
        const sellerPayout = order.totalAmount - platformFee;
        if (!sellerEarnings[order.sellerId])
            sellerEarnings[order.sellerId] = { total: 0, orders: [] };
        sellerEarnings[order.sellerId].total += sellerPayout;
        sellerEarnings[order.sellerId].orders.push(doc.id);
    });
    for (const [sellerId, data] of Object.entries(sellerEarnings)) {
        if (data.total < 5000)
            continue;
        const sellerDoc = await db.collection('sellers').doc(sellerId).get();
        const seller = sellerDoc.data();
        if (!(seller === null || seller === void 0 ? void 0 : seller.bankDetails))
            continue;
        await db.collection('payouts').add({
            sellerId, amount: data.total, orders: data.orders, status: 'pending',
            bankDetails: seller.bankDetails, createdAt: new Date(),
        });
        for (const orderId of data.orders) {
            await db.collection('orders').doc(orderId).update({ payoutProcessed: true, payoutId: sellerId });
        }
        await db.collection('sellers').doc(sellerId).update({
            totalEarnings: (seller.totalEarnings || 0) + data.total, lastPayoutAt: new Date(),
        });
    }
    return { success: true, processed: Object.keys(sellerEarnings).length, totalPayouts: Object.values(sellerEarnings).reduce((sum, e) => sum + e.total, 0) };
});
//# sourceMappingURL=index.js.map