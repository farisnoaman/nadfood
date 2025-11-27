# 🚀 Vercel Deployment Environment Variables Setup

## Required Environment Variables for Shipment Tracking App

### Step 1: Copy Variables to Vercel
Go to your Vercel project dashboard and add these environment variables:

#### VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://kjvzhzbxspgvvmktjwdi.supabase.co
Environment: Production, Preview, Development
```

#### VITE_SUPABASE_ANON_KEY
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdnpoemJ4c3BndnZta3Rqd2RpIiwicm9sZSI6ImFub255bW91cyIsImlhdCI6MTc2MjYyNjIxNCwiZXhwIjoyMDc4MjAyMjE0fQ.7f3k6YK-RnhL15_jhc-SODN_UFsPLnG3JQdjpgAOKGk
Environment: Production, Preview, Development
```

### Step 2: Redeploy
After adding the variables:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Wait for completion

### Step 3: Verify
- ✅ Login should work without "Invalid API key" errors
- ✅ No 401 authentication errors
- ✅ App functions normally

## 📋 Alternative: Using the .env.deployment File

The `.env.deployment` file in your repository root contains the correct values. You can copy these directly into Vercel.

## ⚠️ Important Notes

- **VITE_ prefix is required** for Vite to expose variables to client-side code
- **Use Production environment** for the deployed app
- **Redeploy is required** after changing environment variables
- **These are public keys** - safe to expose in client-side code

## 🔍 Troubleshooting

If you still get "Invalid API key" errors:
1. Verify the exact key values match (no extra spaces)
2. Ensure you're using the `anon/public` key, not `service_role`
3. Check that variables are set for the Production environment
4. Force redeploy after updating variables