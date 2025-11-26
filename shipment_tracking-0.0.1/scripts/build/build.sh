#!/bin/bash

# Build Script for Shipment Tracking PWA with IndexedDB
# Run this on a machine with Node.js 20+ installed

set -e  # Exit on error

echo "========================================="
echo "Shipment Tracking PWA - Build Script"
echo "========================================="
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "Detected Node.js version: $(node -v)"

if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ ERROR: Node.js 20+ required (found v$NODE_VERSION)"
    echo "Please upgrade Node.js:"
    echo "  - Download from: https://nodejs.org/"
    echo "  - Or use nvm: nvm install 20 && nvm use 20"
    exit 1
fi

echo "✅ Node.js version check passed"
echo ""

# Navigate to project directory
cd "$(dirname "$0")/shipment_tracking-0.0.1"
echo "📂 Working directory: $(pwd)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build
echo "✅ Build complete!"
echo ""

# Verify build output
if [ -d "dist" ]; then
    echo "✅ dist/ folder created successfully"
    echo "📊 Build statistics:"
    echo "  - Total files: $(find dist -type f | wc -l)"
    echo "  - Total size: $(du -sh dist | cut -f1)"
    echo ""
    echo "📁 Key files:"
    ls -lh dist/*.html dist/*.js 2>/dev/null || true
    ls -lh dist/assets/*.js 2>/dev/null | head -5 || true
    echo ""
else
    echo "❌ ERROR: dist/ folder not found"
    exit 1
fi

echo "========================================="
echo "✅ Build Successful!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Test locally: npm run preview"
echo "2. Deploy dist/ folder to your hosting provider"
echo "3. Clear browser cache after deployment"
echo "4. Test IndexedDB migration in DevTools"
echo ""
echo "Deploy command example:"
echo "  # Replace with your actual deployment command"
echo "  # scp -r dist/* user@server:/var/www/shipment-app/"
echo ""
