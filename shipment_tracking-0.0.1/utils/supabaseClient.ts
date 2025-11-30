
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../supabase/database.types';

// Load environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
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
