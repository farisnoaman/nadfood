#!/bin/bash

# Shipment Tracking - Android APK Build Script
# This script automates the process of building the Android APK

set -e  # Exit on error

echo "🚀 Starting Shipment Tracking Android APK Build..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node -v)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm found: $(npm -v)${NC}"

# Check for ANDROID_HOME
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}⚠ ANDROID_HOME not set. You may need to build using Android Studio.${NC}"
    echo -e "${YELLOW}  See ANDROID_APK_GUIDE.md for setup instructions.${NC}"
else
    echo -e "${GREEN}✓ ANDROID_HOME found: $ANDROID_HOME${NC}"
fi

echo ""
echo "📦 Step 1/6: Installing dependencies..."
npm install

echo ""
echo "📦 Step 2/6: Installing Capacitor..."
npm install @capacitor/core @capacitor/cli @capacitor/android

echo ""
echo "📦 Step 3/6: Building web application..."
npm run build

echo ""
echo "📦 Step 4/6: Initializing Capacitor (if not already initialized)..."
if [ ! -f "capacitor.config.ts" ]; then
    npx cap init "Shipment Tracking" "com.shipment.tracking" --web-dir=dist
else
    echo -e "${GREEN}✓ Capacitor already initialized${NC}"
fi

echo ""
echo "📦 Step 5/6: Adding/Updating Android platform..."
if [ ! -d "android" ]; then
    npx cap add android
else
    echo -e "${GREEN}✓ Android platform already exists, syncing...${NC}"
    npx cap sync android
fi

echo ""
echo "📦 Step 6/6: Building Android APK..."

if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}⚠ ANDROID_HOME not set. Opening Android Studio...${NC}"
    echo -e "${YELLOW}  Please build the APK from Android Studio:${NC}"
    echo -e "${YELLOW}  Build → Build Bundle(s) / APK(s) → Build APK(s)${NC}"
    npx cap open android
else
    echo "Building APK using Gradle..."
    cd android
    
    # Make gradlew executable
    chmod +x gradlew
    
    # Build debug APK
    ./gradlew assembleDebug
    
    cd ..
    
    # Check if APK was built successfully
    if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
        echo -e "${GREEN}✅ APK BUILT SUCCESSFULLY!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${GREEN}📱 APK Location:${NC}"
        echo "   android/app/build/outputs/apk/debug/app-debug.apk"
        echo ""
        echo -e "${GREEN}📊 APK Size:${NC}"
        ls -lh android/app/build/outputs/apk/debug/app-debug.apk | awk '{print "   " $5}'
        echo ""
        echo -e "${GREEN}🚀 Next Steps:${NC}"
        echo "   1. Transfer APK to your Android device"
        echo "   2. Enable 'Install from Unknown Sources' in device settings"
        echo "   3. Install and test the app"
        echo ""
        echo -e "${GREEN}📝 For production build, see: ANDROID_APK_GUIDE.md${NC}"
        echo ""
    else
        echo -e "${RED}❌ APK build failed. Check the error messages above.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Build process complete!${NC}"
