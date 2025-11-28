// Shared utilities for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Admin role constant (Arabic)
export const ADMIN_ROLE = 'ادمن';

// Create Supabase client with user auth token
export const createUserClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
};

// Create Supabase admin client with service role
export const createAdminClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

// Verify user authentication
export const verifyAuth = async (authHeader: string | null) => {
  if (!authHeader) {
    return { error: 'Missing authorization header', status: 401 };
  }

  // Extract JWT token from Authorization header
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return { error: 'Invalid authorization header format', status: 401 };
  }

  try {
    // Create a Supabase client with the user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    // Get user from the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return { error: 'Unauthorized', status: 401 };
    }

    return { user, supabaseClient };
  } catch (error) {
    return { error: 'Authentication verification failed', status: 401 };
  }
};

// Verify admin role
export const verifyAdminRole = async (userId: string, supabaseClient: any) => {
  const { data: userData, error: roleError } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (roleError || userData?.role !== ADMIN_ROLE) {
    return { error: 'Forbidden: Admin access required', status: 403 };
  }

  return { userData };
};

// Handle CORS preflight requests
export const handleCors = () => {
  return new Response('ok', { headers: corsHeaders });
};

// Create error response
export const createErrorResponse = (error: string, status: number = 500) => {
  return new Response(
    JSON.stringify({ error }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
};

// Create success response
export const createSuccessResponse = (data: any, status: number = 200) => {
  return new Response(
    JSON.stringify(data),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
};

// Validate password requirements
export const validatePassword = (password: string) => {
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
};

// Log function execution
export const logExecution = (functionName: string, message: string) => {
  console.log(`[${functionName}] ${message}`);
};