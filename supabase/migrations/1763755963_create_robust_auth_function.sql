-- Migration: create_robust_auth_function
-- Created at: 1763755963

-- Create a more robust authentication function
CREATE OR REPLACE FUNCTION get_authenticated_user_id()
RETURNS UUID AS $$
DECLARE
  user_id UUID;
  jwt_claims TEXT;
  jwt_payload JSONB;
BEGIN
  -- Method 1: Direct auth.uid() (should work in most cases)
  BEGIN
    user_id := auth.uid();
    IF user_id IS NOT NULL THEN
      RETURN user_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Method 2: Extract from JWT claims
  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true);
    IF jwt_claims IS NOT NULL AND jwt_claims != '' THEN
      jwt_payload := jwt_claims::jsonb;
      user_id := (jwt_payload->>'sub')::uuid;
      IF user_id IS NOT NULL THEN
        RETURN user_id;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Method 3: Try current_setting
  BEGIN
    user_id := current_setting('app.user_id', true)::uuid;
    IF user_id IS NOT NULL THEN
      RETURN user_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_user_role to use this new function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
BEGIN
  current_user_id := get_authenticated_user_id();
  
  IF current_user_id IS NULL THEN
    RETURN '';
  END IF;
  
  SELECT role INTO user_role 
  FROM users 
  WHERE id = current_user_id AND is_active = true;
  
  RETURN COALESCE(user_role, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;