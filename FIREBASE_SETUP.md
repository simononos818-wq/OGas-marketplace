# Firebase Setup for ogasapp-5a003

**Project ID:** `ogasapp-5a003`  
**Status:** Ready to configure

---

## 🔑 Step 1: Get Your Firebase Credentials

1. Go to **[Firebase Console](https://console.firebase.google.com)**
2. Select project: **ogasapp-5a003**
3. Click **⚙️ Project Settings** (top left)
4. Go to **General** tab
5. Scroll down to find your **Web API Key** section

**Copy these values:**
```
Project ID: ogasapp-5a003
Web API Key: AIzaSy...
Auth Domain: ogasapp-5a003.firebaseapp.com
Storage Bucket: ogasapp-5a003.appspot.com
Messaging Sender ID: (12-digit number)
App ID: 1:...:web:...
```

---

## 🔐 Step 2: Get Service Account Key

1. Go back to Firebase Console for **ogasapp-5a003**
2. Click **⚙️ Project Settings** → **Service Accounts**
3. Click **Generate New Private Key**
4. A JSON file will download — **save it safely**
5. Copy the entire contents (it starts with `{"type":"service_account"...`)

---

## 📝 Step 3: Create .env.local File

In your project root (`/Users/mac/OGasmarketplace/OGasmarketplace`), create `.env.local`:

```bash
# Firebase Configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ogasapp-5a003
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY_HERE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ogasapp-5a003.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ogasapp-5a003.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID_HERE
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID_HERE

# Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_SDK_KEY={"type":"service_account","project_id":"ogasapp-5a003",...PASTE_ENTIRE_JSON_HERE...}

# Paystack (Use Test Keys for now)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_47b1cd395f6045d981f76860580aaf9871d58fe3
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here

# FCM VAPID Key (Push Notifications - optional for now)
NEXT_PUBLIC_FCM_VAPID_KEY=your_vapid_key_here

# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ogasapp-5a003.web.app
```

---

## ⬇️ Step 4: Install Dependencies

```bash
cd /Users/mac/OGasmarketplace/OGasmarketplace

# Install firebase-admin (needed for setup script)
npm install firebase-admin

# Verify installation
npm list firebase-admin
```

---

## 🚀 Step 5: Run Firestore Setup Script

```bash
# Run the setup script
node scripts/setup-firestore.js
```

**Expected output:**
```
🚀 Starting Firestore setup...

📝 Creating 'users' collection...
   ✓ Added 2 documents to 'users'

📝 Creating 'sellers' collection...
   ✓ Added 2 documents to 'sellers'

[... more collections ...]

✅ Firestore setup complete!

📊 Summary:
   ✓ 13 collections created
   ✓ Sample data populated
   ✓ Ready for Firebase Hosting deployment
```

---

## 🔒 Step 6: Deploy Security Rules

**Create `firestore.rules` file:**

```bash
cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Sellers can read/write their own business info
    match /sellers/{sellerId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow read: if true; // Public reads for ratings
    }

    // Products are publicly readable
    match /seller_products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Orders
    match /orders/{orderId} {
      allow read, write: if request.auth.uid == resource.data.userId ||
                           request.auth.uid == resource.data.sellerId;
      allow write: if request.auth != null;
    }

    // Deliveries
    match /deliveries/{deliveryId} {
      allow read, write: if request.auth != null;
    }

    // Transactions (admin only)
    match /transactions/{docId} {
      allow read, write: if request.auth.token.admin == true;
    }

    // Public collections
    match /{document=**} {
      allow read: if true;
    }
  }
}
EOF

# Deploy rules
firebase deploy --only firestore:rules
```

---

## 🧪 Step 7: Test Locally

```bash
# Install all dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000

# Test:
# 1. Product page shows 4 items with multiple sellers
# 2. Price comparison works (http://localhost:3000/price-comparison)
# 3. Tracking page works (http://localhost:3000/tracking)
# 4. Admin dashboard works (http://localhost:3000/admin/commissions)
```

---

## 🚀 Step 8: Deploy to Production

```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Verify deployment
# Your app should be live at: https://ogasapp-5a003.web.app
```

---

## ✅ Deployment Checklist

- [ ] Firebase credentials copied to `.env.local`
- [ ] Service Account Key saved and added to `.env.local`
- [ ] Dependencies installed (`npm install firebase-admin`)
- [ ] Firestore setup script ran successfully (`node scripts/setup-firestore.js`)
- [ ] All 13 collections visible in Firebase Console
- [ ] Security rules deployed
- [ ] Local testing passed (npm run dev)
- [ ] Production build created (npm run build)
- [ ] Deployed to Firebase Hosting (firebase deploy --only hosting)
- [ ] ✅ **LIVE** at https://ogasapp-5a003.web.app

---

## 🎯 Summary

Your project **ogasapp-5a003** is ready for:
- ✅ Multi-vendor marketplace
- ✅ Real-time delivery tracking
- ✅ Commission management
- ✅ Push notifications
- ✅ Seller dashboard
- ✅ Admin analytics

**Estimated time to go live: 2-3 hours from now**

All code is production-ready. You just need to:
1. Add credentials to `.env.local` (10 min)
2. Run setup script (5 min)
3. Deploy security rules (5 min)
4. Test locally (30 min)
5. Deploy to Firebase (30 min)

**Total: ~1.5 hours to live! 🎉**

---

## 🆘 Troubleshooting

**Error: Cannot find module 'firebase-admin'**
```bash
npm install firebase-admin
```

**Error: FIREBASE_ADMIN_SDK_KEY not found**
- Ensure you've created `.env.local` with all required fields
- Restart Node: `npm run dev`

**Error: Project not found**
- Verify project ID is exactly: `ogasapp-5a003`
- Check Firebase Console access

**Firestore rules failed to deploy**
```bash
firebase login
firebase use ogasapp-5a003
firebase deploy --only firestore:rules
```

---

**Next: Create `.env.local` file with your Firebase credentials and run the setup script!**
