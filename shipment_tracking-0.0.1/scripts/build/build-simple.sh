#!/bin/bash
# Simple build without Vite - bundles React app manually

echo "🚀 Starting simple build process..."

cd shipment_tracking-0.0.1

# Copy all necessary files to a new build directory
mkdir -p simple-build
mkdir -p simple-build/assets

# Copy HTML, CSS, JS files
echo "📦 Copying files..."
cp index.html simple-build/
cp -r public/* simple-build/ 2>/dev/null || true
cp dist/sw.js simple-build/ 2>/dev/null || true
cp dist/manifest.json simple-build/ 2>/dev/null || true

echo "✅ Simple build created in simple-build/"
echo "📱 Ready for APK conversion using PWABuilder.com"
