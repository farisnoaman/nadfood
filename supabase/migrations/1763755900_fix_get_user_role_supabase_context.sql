-- Migration: fix_get_user_role_supabase_context
-- Created at: 1763755900

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
  auth_header TEXT;
  jwt_payload JSONB;
BEGIN
  -- Try multiple methods to get user info
  
  -- Method 1: Direct auth.uid() call (most reliable for Supabase)
  BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NOT NULL THEN
      SELECT role INTO user_role FROM users WHERE id = current_user_id AND is_active = true;
      RETURN COALESCE(user_role, '');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to next method
    NULL;
  END;
  
  -- Method 2: Extract from JWT token if auth.uid() fails
  BEGIN
    auth_header := current_setting('request.jwt.claims', true);
    IF auth_header IS NOT NULL AND auth_header != '' THEN
      jwt_payload := auth_header::jsonb;
      current_user_id := (jwt_payload->>'sub')::uuid;
      IF current_user_id IS NOT NULL THEN
        SELECT role INTO user_role FROM users WHERE id = current_user_id AND is_active = true;
        RETURN COALESCE(user_role, '');
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to next method
    NULL;
  END;
  
  -- Method 3: Try to get from request headers
  BEGIN
    auth_header := current_setting('request.headers', true);
    IF auth_header IS NOT NULL AND auth_header LIKE '%authorization%' THEN
      -- Extract user info if possible
      current_user_id := current_setting('app.current_user_id', true)::uuid;
      IF current_user_id IS NOT NULL THEN
        SELECT role INTO user_role FROM users WHERE id = current_user_id AND is_active = true;
        RETURN COALESCE(user_role, '');
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Return empty string if all methods fail
    NULL;
  END;
  
  -- If no method worked, return empty string
  RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO anon;;