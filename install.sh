#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           🚀 OGas Nigeria - Smart Installer v2.0              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "${BLUE}📋 Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install from https://nodejs.org/"
    exit 1
fi
echo "${GREEN}✅ Node.js $(node --version)${NC}"

# Install dependencies
echo ""
echo "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Create .env.local if not exists
if [ ! -f ".env.local" ]; then
    echo ""
    echo "${YELLOW}📝 Creating .env.local...${NC}"
    cat > .env.local << 'ENVFILE'
# 🔥 Firebase Configuration
# Get these from: https://console.firebase.google.com
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# 💳 Paystack (for Nigerian payments)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_key

# 🌐 App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENVFILE
    echo "${YELLOW}⚠️  Please edit .env.local with your Firebase credentials!${NC}"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 Setup Complete!                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "${GREEN}Next steps:${NC}"
echo "1. Add your Firebase credentials to .env.local"
echo "2. Enable Phone Auth in Firebase Console"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:3000"
echo ""
echo "${BLUE}Firebase Setup:${NC}"
echo "1. Go to https://console.firebase.google.com"
echo "2. Authentication → Sign-in method → Enable Phone"
echo "3. Add test phone: +2348012345678, code: 123456"
echo ""

read -p "${YELLOW}Start the development server now? (y/n): ${NC}" start
if [[ $start =~ ^[Yy]$ ]]; then
    npm run dev
fi
