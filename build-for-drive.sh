#!/bin/bash

echo "🚀 Building OGas Android APK for Google Drive..."

# Install Capacitor if not already
npm install @capacitor/core @capacitor/cli @capacitor/android --save

# Build web app
npm run build

# Add Android platform
npx cap add android

# Sync files
npx cap sync

# Build debug APK (for sharing)
cd android && ./gradlew assembleDebug

echo "✅ APK built successfully!"
echo "📁 Location: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Next steps:"
echo "1. Upload android/app/build/outputs/apk/debug/app-debug.apk to Google Drive"
echo "2. Share the Drive link with your users"
echo "3. Users need to enable 'Install from unknown sources' to install"
