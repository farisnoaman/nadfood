// Quick Supabase Connection Test
// Run this in browser console to verify API key

// Test 1: Check if environment variables are loaded
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Test 2: Try basic Supabase connection
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test connection
  supabase.from('users').select('count').single()
    .then(result => {
      console.log('✅ Supabase connection successful');
      console.log('Result:', result);
    })
    .catch(error => {
      console.log('❌ Supabase connection failed');
      console.log('Error:', error);
    });
} else {
  console.log('❌ Environment variables not found');
}