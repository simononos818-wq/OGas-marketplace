# Deployment Guide for OGas LPG Marketplace

This project is built with Expo + React Native and supports web deployment.

## 1. Build the web app

From the project root:

```bash
npm install
npm run build:web
```

This generates a production-ready web build in the `web-build` output folder.

## 2. Choose a hosting provider

Recommended hosts:
- Vercel
- Netlify
- Firebase Hosting
- AWS Amplify
- GitHub Pages (static hosting)

If you use Vercel or Netlify, connect your repository and set the build command to:

```bash
npm run build:web
```

Then set the output folder to `web-build`.

## 3. Configure your custom domain

For `ogaslpgmarketplace.com`:
1. In your hosting provider settings, add `ogaslpgmarketplace.com` and `www.ogaslpgmarketplace.com` as custom domains.
2. Update your DNS provider with the records given by the hosting provider:
   - Vercel: typically `CNAME` or `A` records
   - Netlify: typically `A` records + `CNAME`
3. Wait for DNS propagation (usually minutes, sometimes up to 24 hours).

## 4. Verify SSL

Most modern hosts provide automatic HTTPS for custom domains. Confirm the domain is secured with SSL after deployment.

## 5. Optional: use Expo web preview

To preview locally in web mode:

```bash
npm run web
```

Then open the local browser URL shown in the terminal.

## Notes
- This repository is a mobile-first Expo app, so the web version is a progressive web app suited for browser-based access.
- If you want true native app deployment for Android / iOS, use Expo Application Services (EAS) or standard app store publishing.
