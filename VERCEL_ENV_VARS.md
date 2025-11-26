# Environment Variables Setup for Vercel

## Required Variables for Shipment Tracking App

### VITE_SUPABASE_URL
**Value:** `https://kjvzhzbxspgvvmktjwdi.supabase.co`
**Type:** Plain text
**Required:** Yes

### VITE_SUPABASE_ANON_KEY
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdnpoemJ4c3BndnZta3Rqd2RpIiwicm9sZSI6ImFub255bW91cyIsImlhdCI6MTc2MjYyNjIxNCwiZXhwIjoyMDc4MjAyMjE0fQ.7f3k6YK-RnhL15_jhc-SODN_UFsPLnG3JQdjpgAOKGk`
**Type:** Plain text
**Required:** Yes

## Security Notes
- These variables are safe to expose in client-side code (they're public keys)
- The service role key is NOT included (it's server-side only)
- Variables must be prefixed with VITE_ to be accessible in Vite builds