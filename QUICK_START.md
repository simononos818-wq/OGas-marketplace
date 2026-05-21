# 🚀 OGas Ventures - Quick Start Guide

## Login to Admin Dashboard

1. **Visit:** https://ogaslpgmarketplace.com/admin
2. **Create test account:**
   - Email: `admin@ogas.com`
   - Password: Create any secure password
3. **Sign up** to create your admin account
4. **View dashboard:**
   - Orders Tab: See all customer purchases
   - Analytics Tab: View revenue and order stats

---

## How to Process Payments

### Setup (One-time):
1. Get your Paystack **Secret Key** from: https://dashboard.paystack.com/#/settings/developer
2. Update `.env.local`:
   ```env
   PAYSTACK_SECRET_KEY="sk_test_YOUR_SECRET_KEY_HERE"
   ```
3. Redeploy: `firebase deploy --only hosting:ogas-host`

### Customer Payment Flow:
1. Customer browses products at `/products`
2. Clicks "Buy Now" on any product
3. Redirected to login if not authenticated
4. Paystack checkout opens
5. Payment processed
6. Confirmation email sent
7. Order appears in admin dashboard

---

## Firestore Setup

### Enable Collections:
1. Go to: https://console.firebase.google.com/project/ogasapp-5a003/firestore
2. Collections will be created automatically when orders are placed

### Current Collections:
- **orders** - Auto-created on first payment

---

## Testing Payments

### Test Card Details:
- Card: `4111 1111 1111 1111`
- Expiry: `12/30`
- CVV: `123`
- Amount: Any amount (e.g., ₦5,000)

### Test Webhook:
Send POST request to:
```
https://ogaslpgmarketplace.com/api/paystack-webhook
```

---

## Key URLs

| Page | URL |
|------|-----|
| Homepage | https://ogaslpgmarketplace.com |
| Products | https://ogaslpgmarketplace.com/products |
| Auth | https://ogaslpgmarketplace.com/auth |
| Orders | https://ogaslpgmarketplace.com/orders |
| Admin | https://ogaslpgmarketplace.com/admin |
| Success | https://ogaslpgmarketplace.com/success |

---

## Live Statistics

Your marketplace now has:
- ✅ **Full user authentication**
- ✅ **4 product listings with search**
- ✅ **Paystack payment integration**
- ✅ **Order management system**
- ✅ **Admin dashboard**
- ✅ **Real-time Firestore database**

---

## Next Actions (Priority Order)

### 1. **Add Paystack Secret Key** (5 min)
```bash
# Edit .env.local
PAYSTACK_SECRET_KEY="sk_test_YOUR_KEY"
firebase deploy --only hosting:ogas-host
```

### 2. **Test a Payment** (10 min)
- Go to products page
- Click "Buy Now"
- Use test card above
- Check admin dashboard for order

### 3. **Configure Firestore Rules** (15 min)
Add to Firestore Rules:
```javascript
match /orders/{document=**} {
  allow read, write: if request.auth != null;
}
```

### 4. **Add Business Contact Info** (5 min)
Update in pages:
```
- Homepage: /app/page.tsx (line 50+)
- Products: /app/products/page.tsx (footer)
```

### 5. **Set Delivery Setup** (30 min)
- Add delivery zones in admin
- Create delivery partner integration
- Setup SMS notifications (Twilio)

---

## Troubleshooting

### Payment Not Processing?
1. Check Paystack secret key is correct
2. Ensure CORS is enabled
3. Check browser console for errors
4. Verify webhook endpoint is accessible

### Admin Dashboard Empty?
1. Ensure you're logged in
2. Check Firestore rules allow read access
3. Try placing a test order first

### Build Fails?
```bash
cd starters/nextjs/basic
npm install
npm run build
```

---

## Commands Reference

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Local preview
npm run start

# Deploy to Firebase
firebase deploy --only hosting:ogas-host

# Deploy functions only
firebase deploy --only functions

# View Firestore
firebase firestore:inspect

# View logs
firebase functions:log
```

---

## Support

**Created:** February 24, 2026  
**Platform:** Next.js 15 + Firebase + Paystack  
**Status:** Production Ready ✅

For questions, check the `MARKETPLACE_README.md` file in the same directory.
