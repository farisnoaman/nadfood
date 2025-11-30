// Shared utilities for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

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

// Validate UUID format
export const validateUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return { error: 'Invalid UUID format' };
  }
  return { valid: true };
};

// Validate password requirements
export const validatePassword = (password: string) => {
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' };
  }
  if (password.length > 128) {
    return { error: 'Password must be less than 128 characters long' };
  }
  // Check for common weak passwords
  const weakPasswords = ['password', '123456', 'admin', 'user'];
  if (weakPasswords.includes(password.toLowerCase())) {
    return { error: 'Password is too weak' };
  }
  return { valid: true };
};

// Validate username
export const validateUsername = (username: string) => {
  if (!username || username.trim().length === 0) {
    return { error: 'Username is required' };
  }
  if (username.length > 50) {
    return { error: 'Username must be less than 50 characters' };
  }
  // Allow Arabic, English letters, numbers, spaces, hyphens, underscores
  if (!/^[\w\u0600-\u06FF\s\-_.]+$/.test(username)) {
    return { error: 'Username contains invalid characters' };
  }
  return { valid: true };
};

// Validate role
export const validateRole = (role: string) => {
  const allowedRoles = ['مسؤول الحركة', 'محاسب', 'ادمن'];
  if (!allowedRoles.includes(role)) {
    return { error: 'Invalid role specified' };
  }
  return { valid: true };
};

// Rate limiting store (in-memory, resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 10; // Max requests per window

// Check rate limit
export const checkRateLimit = (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetTime: record.resetTime };
};

// Log function execution
export const logExecution = (functionName: string, message: string) => {
  console.log(`[${functionName}] ${message}`);
};