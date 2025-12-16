#!/bin/bash

# Environment Variables Setup Script for Shipment Tracking App
# This script helps set up environment variables for different hosting platforms

echo "🚀 Shipment Tracking - Environment Variables Setup"
echo "=================================================="
echo ""

# Supabase Configuration
SUPABASE_URL="https://kjvzhzbxspgvvmktjwdi.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdnpoemJ4c3BndnZta3Rqd2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjYyMTQsImV4cCI6MjA3ODIwMjIxNH0.xc1wMNg_q23ZbNhUm6oyKbUw_298y0xG9B8YBU6j2VI"

echo "📋 Required Environment Variables:"
echo "=================================="
echo ""
echo "VITE_SUPABASE_URL=$SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
echo ""

echo "🌐 Hosting Platform Setup Instructions:"
echo "======================================"
echo ""

echo "1️⃣ Vercel:"
echo "   Dashboard → Your Project → Settings → Environment Variables"
echo "   Add both variables for Production, Preview, and Development"
echo ""

echo "2️⃣ Netlify:"
echo "   Dashboard → Site Settings → Environment Variables"
echo "   Add both variables"
echo ""

echo "3️⃣ Railway:"
echo "   Dashboard → Project → Variables"
echo "   Add both variables"
echo ""

echo "4️⃣ Render:"
echo "   Dashboard → Service → Environment"
echo "   Add both variables"
echo ""

echo "5️⃣ GitHub Pages (with GitHub Actions):"
echo "   Repository → Settings → Secrets and variables → Actions"
echo "   Add both as repository secrets"
echo ""

echo "6️⃣ Manual Build (for static hosting):"
echo "   Set environment variables before building:"
echo "   export VITE_SUPABASE_URL=\"$SUPABASE_URL\""
echo "   export VITE_SUPABASE_ANON_KEY=\"$SUPABASE_ANON_KEY\""
echo "   npm run build"
echo ""

echo "✅ After setting up environment variables:"
echo "   Redeploy your application"
echo "   The error should be resolved!"
echo ""

echo "🔧 For local development:"
echo "   Ensure .env file exists with the above variables"