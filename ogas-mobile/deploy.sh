#!/bin/bash
set -e

cd /Users/mac/OGasmarketplace/OGasmarketplace/starters/nextjs/basic/ogas-mobile

echo "🧹 Cleaning..."
rm -rf .expo dist node_modules/.cache public/*

echo "📦 Exporting for web..."
npx expo export --platform web

echo "🚀 Copying to public..."
mkdir -p public
cp -r dist/* public/

echo "🔥 Deploying to Firebase..."
firebase deploy --only hosting:ogasapp-5a003

echo "✅ DONE! Live at: https://ogasapp-5a003.web.app"
