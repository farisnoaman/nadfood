# Vercel Deployment Guide

## 🚀 Deployment Configuration

This project is configured to deploy from the `shipment_tracking-0.0.1/` subdirectory using the `vercel.json` configuration in the repository root.

## 📋 Vercel Configuration

The `vercel.json` file in the root directory contains:
- Build command: `cd shipment_tracking-0.0.1 && npm run build`
- Output directory: `shipment_tracking-0.0.1/dist`
- Install command: `cd shipment_tracking-0.0.1 && npm install`
- Framework: Vite with SPA routing

## 🔧 Environment Variables Required

Set these in your Vercel project settings:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## 📦 Deployment Methods

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration
1. Push this repository to GitHub
2. Connect the repository to Vercel
3. Vercel will auto-deploy using the vercel.json configuration

## ✅ Build Verification

The project builds successfully and generates the following output:
- `dist/index.html` - Main HTML file
- `dist/assets/` - Compiled CSS and JS bundles
- `dist/icon-*.png` - PWA icons
- `dist/sw.js` - Service worker for offline functionality

## 🎯 Post-Deployment

After deployment:
1. Set environment variables in Vercel dashboard
2. Test the application functionality
3. Verify PWA installation works
4. Check offline mode capabilities

---
*Generated for Shipment Tracking Application v0.0.1*