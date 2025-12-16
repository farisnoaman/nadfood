
import { createClient } from '@supabase/supabase-js';
import { Database } from '../supabase/database.types';

// Load environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `
🚨 Missing Supabase Configuration 🚨

Environment variables not found:
- VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}
- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}

For production deployment, set these variables in your hosting platform:

**Vercel:**
Dashboard → Project → Settings → Environment Variables

**Netlify:**
Dashboard → Site → Environment Variables

**Railway:**
Dashboard → Project → Variables

**Render:**
Dashboard → Service → Environment

Values needed:
VITE_SUPABASE_URL=https://kjvzhzbxspgvvmktjwdi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdnpoemJ4c3BndnZta3Rqd2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjYyMTQsImV4cCI6MjA3ODIwMjIxNH0.xc1wMNg_q23ZbNhUm6oyKbUw_298y0xG9B8YBU6j2VI

For local development, ensure .env file exists with these variables.
  `.trim();

  throw new Error(errorMsg);
}

// Configure Supabase client with enhanced security settings
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Reduce session duration for better security
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Note: Actual session expiry is configured server-side in Supabase dashboard
    // Access tokens: 1 hour (default)
    // Refresh tokens: 24 hours (configured in Supabase project settings)
  },
  global: {
    headers: {
      'X-Client-Info': 'shipment-tracking-app',
    },
  },
});
