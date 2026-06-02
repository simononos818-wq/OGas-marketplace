# Connect Custom Domain ogaslpgmarketplace.com to Firebase

**Project ID:** `ogasapp-5a003`  
**Custom Domain:** `ogaslpgmarketplace.com`  
**Current Default URL:** `https://ogasapp-5a003.web.app`

---

## 🎯 Goal
Make your app available at: **https://ogaslpgmarketplace.com**

---

## 📋 Step-by-Step Setup

### Step 1: Verify Domain Ownership in Firebase Console

1. Go to **[Firebase Console](https://console.firebase.google.com)**
2. Select project: **ogasapp-5a003**
3. Click **Hosting** (left sidebar)
4. Click **Add custom domain** button
5. Enter your domain: `ogaslpgmarketplace.com`
6. Click **Continue**

Firebase will show you **TXT verification record**:
```
Domain: ogaslpgmarketplace.com
Type: TXT
Name: _acme-challenge.ogaslpgmarketplace.com
Value: (verification code - copy this)
```

---

### Step 2: Add DNS Verification Record

Go to your **Domain Registrar** where you purchased `ogaslpgmarketplace.com`:

**Popular registrars:**
- Namecheap
- GoDaddy
- Google Domains
- Domain.com
- Bluehost

**Add TXT record:**
1. Go to DNS settings
2. Add new TXT record:
   - **Name/Host:** `_acme-challenge`
   - **Value:** (paste from Firebase Console)
   - **TTL:** 3600 (or default)
3. Click **Save**

**Wait 5-10 minutes** for DNS propagation.

---

### Step 3: Verify in Firebase

Back in Firebase Console:
1. Click **Verify** button
2. Wait for verification (usually 2-5 minutes)
3. You should see: ✅ **Domain verified**

---

### Step 4: Add Firebase Hosting Records

Once verified, Firebase will show you **A records** to add:

```
Type: A
Name: ogaslpgmarketplace.com
Values:
  199.36.158.100
  199.36.158.101
  199.36.158.102
  199.36.158.103
```

**Add these A records to your registrar:**

1. Go back to Domain Registrar DNS settings
2. Find/Edit the **A record** for `ogaslpgmarketplace.com`
3. Add/replace with Firebase's IP addresses
4. Click **Save**

---

### Step 5: Wait for DNS Propagation

DNS changes take **24-48 hours** to fully propagate, but usually work within:
- 5-10 minutes ⚡ (fast)
- 1-4 hours 🕐 (typical)
- 12-24 hours 📅 (slow)

**Check DNS status:**
```bash
# Check DNS propagation
dig ogaslpgmarketplace.com

# Should return Firebase's IP addresses
```

---

### Step 6: Configure Firebase Hosting

Your `firebase.json` should already be configured:

```json
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

### Step 7: Deploy to Custom Domain

```bash
# Make sure you're logged in
firebase login

# Select correct project
firebase use ogasapp-5a003

# Deploy
firebase deploy --only hosting
```

**Expected output:**
```
=== Deploying to 'ogasapp-5a003'...

i  deploying hosting
i  hosting: preparing dist directory for upload...
✔  hosting: 127 files uploaded successfully

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/ogasapp-5a003
Hosting URL: https://ogaslpgmarketplace.com
```

---

## 🔗 DNS Configuration Summary

### Add these records to your registrar:

**1. TXT Record (Verification)**
```
Host: _acme-challenge
Type: TXT
Value: (from Firebase Console)
TTL: 3600
```

**2. A Records (Firebase Hosting)**
```
Host: @ (or ogaslpgmarketplace.com)
Type: A
Value: 199.36.158.100

Host: @ (or ogaslpgmarketplace.com)
Type: A
Value: 199.36.158.101

Host: @ (or ogaslpgmarketplace.com)
Type: A
Value: 199.36.158.102

Host: @ (or ogaslpgmarketplace.com)
Type: A
Value: 199.36.158.103
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Domain verified in Firebase Console ✅
- [ ] A records pointing to Firebase
- [ ] TXT verification record added
- [ ] DNS propagated (`dig ogaslpgmarketplace.com`)
- [ ] App accessible at `https://ogaslpgmarketplace.com`
- [ ] SSL certificate active (automatic 🔒)
- [ ] Redirect works: `http://ogaslpgmarketplace.com` → `https://`

---

## 🔍 Test Custom Domain

```bash
# Check if domain resolves
ping ogaslpgmarketplace.com

# Should show Firebase IP: 199.36.158.x

# Check HTTPS cert
curl -I https://ogaslpgmarketplace.com

# Should return 200 OK with SSL certificate
```

---

## 📱 What Users Will See

| User Action | Result |
|-------------|--------|
| Visit `ogaslpgmarketplace.com` | ✅ Loads your app |
| Visit `http://ogaslpgmarketplace.com` | ✅ Redirects to HTTPS |
| Visit `www.ogaslpgmarketplace.com` | ❌ Need separate setup |
| Visit `ogasapp-5a003.web.app` | ✅ Also works (default) |

---

## 🌐 Optional: Setup WWW Subdomain

If you want `www.ogaslpgmarketplace.com` to also work:

**Option 1: Firebase Auto-Redirect**
- Firebase automatically creates redirect from `www.` to base domain

**Option 2: Manual Setup**
```bash
# In Firebase Console, add another custom domain:
# www.ogaslpgmarketplace.com
```

---

## 🚨 Troubleshooting

### Issue: Domain verification failed
**Solution:**
- Wait 10 minutes for TXT record to propagate
- Check TXT record is exactly as shown in Firebase
- Remove old DNS records if they exist
- Try verification again

### Issue: Site shows 404 after DNS update
**Solution:**
- Wait 30 minutes for full DNS propagation
- Clear browser cache (Cmd+Shift+Delete on Mac)
- Try incognito/private mode
- Check Firebase deployment completed

### Issue: SSL certificate warning
**Solution:**
- Wait 24 hours (Firebase auto-generates cert)
- Clear browser cache
- Try different browser
- Check domain DNS is correct

### Issue: Stuck on Firebase default domain
**Solution:**
- Verify A records are all 4 Firebase IPs
- Check registrar saved changes
- Test with: `dig ogaslpgmarketplace.com`
- Redeploy: `firebase deploy --only hosting`

---

## 📞 Support

**Registrar Support (for DNS issues):**
- Namecheap: support@namecheap.com
- GoDaddy: call 1-480-505-8877
- Google Domains: support.google.com/domains

**Firebase Support:**
- https://firebase.google.com/support
- Issue tracker: github.com/firebase/firebase-hosting

---

## 🎯 Timeline

| Task | Time | Status |
|------|------|--------|
| Add TXT record | 2 min | 📋 Now |
| Add A records | 2 min | 📋 Now |
| Verify in Firebase | 5 min | ⏳ Next |
| DNS propagation | 5 min - 24 hrs | ⏳ Wait |
| Deploy to domain | 1 min | ✅ Automatic |
| **LIVE at custom domain** | **~10 min** | 🚀 Soon |

---

## 🎉 Success!

Once complete, you'll have:

✅ `https://ogaslpgmarketplace.com/` — Your live marketplace  
✅ `https://ogasapp-5a003.web.app/` — Firebase default (also works)  
✅ SSL/HTTPS — Automatic, always secure 🔒  
✅ All pages working:
   - `/products` — Multi-vendor marketplace
   - `/price-comparison` — Price comparison
   - `/tracking` — Real-time delivery
   - `/seller-dashboard` — Seller earnings
   - `/admin/commissions` — Admin analytics

---

## 📋 Next Steps

1. **Get custom domain records from Firebase Console:**
   - Go to Hosting → Add custom domain → Copy TXT and A records

2. **Add to your registrar:**
   - Login to where you bought `ogaslpgmarketplace.com`
   - Add DNS records
   - Save and wait

3. **Verify in Firebase:**
   - Click verify button
   - Wait for confirmation

4. **Deploy:**
   ```bash
   firebase deploy --only hosting
   ```

5. **Test:**
   ```bash
   open https://ogaslpgmarketplace.com
   ```

**That's it! Your custom domain is live! 🎊**
