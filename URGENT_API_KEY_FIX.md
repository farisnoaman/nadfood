# 🚨 URGENT: Fix Supabase API Key Issue

## Current Status: Authentication Failing

Your deployed app is showing "Invalid API key" errors because the Supabase API key in Vercel is incorrect or outdated.

## 🔧 IMMEDIATE FIX REQUIRED

### Step 1: Get Fresh API Key from Supabase
1. Go to https://supabase.com/dashboard
2. Sign in and select your project: `kjvzhzbxspgvvmktjwdi`
3. Navigate to **Settings** → **API**
4. Copy the **`anon/public`** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
5. **DO NOT use the service_role key**

### Step 2: Update Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your Shipment Tracking project
3. Go to **Settings** → **Environment Variables**
4. Update `VITE_SUPABASE_ANON_KEY` with the fresh key from Step 1
5. Ensure it's set for **Production** environment
6. Save changes

### Step 3: Force Redeploy
1. Go to **Deployments** tab
2. Click the **three dots (⋯)** on the latest deployment
3. Select **"Redeploy"**
4. Wait for completion

## 📊 Verification

After redeployment:
- ✅ Login should work without "Invalid API key" error
- ✅ No 401 errors in browser network tab
- ✅ App functions normally

## ⚠️ Critical Notes

- **Use ONLY the `anon/public` key** from Supabase API settings
- **Copy exactly** - no extra spaces or characters
- **Must redeploy** after updating environment variables
- **Check Production environment** specifically

## 🔍 If Still Failing

If you continue getting errors after following these steps:
1. Verify you're using the correct Supabase project
2. Check that the project is active (not paused)
3. Ensure no IP restrictions are enabled in Supabase
4. Try clearing browser cache and cookies

---
**This is blocking all user authentication. Please fix immediately.**