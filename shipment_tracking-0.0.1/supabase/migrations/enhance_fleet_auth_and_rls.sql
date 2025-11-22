-- Enhanced database authentication and RLS policies
-- This migration improves the authentication context and data access for fleet users

-- 1. Improve the get_user_role function to handle Supabase auth context better
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  current_user_id UUID;
  user_role TEXT;
  user_exists BOOLEAN;
BEGIN
  -- Get current user ID from Supabase auth context
  current_user_id := auth.uid();
  
  -- If no authenticated user, return empty role
  IF current_user_id IS NULL THEN
    RETURN '';
  END IF;
  
  -- Check if user exists in our users table
  SELECT EXISTS(SELECT 1 FROM users WHERE id = current_user_id) INTO user_exists;
  
  -- If user doesn't exist, try to get role from auth metadata as fallback
  IF NOT user_exists THEN
    -- Check auth metadata for role information
    user_role := auth.jwt() ->> 'role';
    IF user_role IS NULL THEN
      user_role := COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'role',
        auth.jwt() -> 'app_metadata' ->> 'role',
        ''
      );
    END IF;
    RETURN COALESCE(user_role, '');
  END IF;
  
  -- Get role from users table
  SELECT role INTO user_role FROM users WHERE id = current_user_id;
  
  -- Return role or empty string if null
  RETURN COALESCE(user_role, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update RLS policies to be more robust
-- Drop existing policies that might be problematic
DROP POLICY IF EXISTS "fleet_access_policy" ON shipments;
DROP POLICY IF EXISTS "fleet_select_policy" ON shipments;
DROP POLICY IF EXISTS "fleet_users_policy" ON users;

-- 3. Create comprehensive fleet access policy
CREATE POLICY "fleet_complete_access" ON shipments
FOR ALL 
TO authenticated
USING (
  get_user_role() = 'sales' OR 
  get_user_role() = 'fleet' OR
  get_user_role() = 'accountant' OR
  get_user_role() = 'admin'
)
WITH CHECK (
  get_user_role() = 'sales' OR 
  get_user_role() = 'fleet' OR
  get_user_role() = 'accountant' OR
  get_user_role() = 'admin'
);

-- 4. Allow fleet users to access basic reference data
CREATE POLICY "fleet_users_read" ON users
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'sales' OR 
  get_user_role() = 'fleet' OR
  get_user_role() = 'accountant' OR
  get_user_role() = 'admin'
);

-- 5. Allow fleet users to access drivers and regions
CREATE POLICY "fleet_drivers_read" ON drivers
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'sales' OR 
  get_user_role() = 'fleet' OR
  get_user_role() = 'accountant' OR
  get_user_role() = 'admin'
);

CREATE POLICY "fleet_regions_read" ON regions
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'sales' OR 
  get_user_role() = 'fleet' OR
  get_user_role() = 'accountant' OR
  get_user_role() = 'admin'
);

CREATE POLICY "fleet_products_read" ON products
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'sales' OR 
  get_user_role() = 'fleet' OR
  get_user_role() = 'accountant' OR
  get_user_role() = 'admin'
);

CREATE POLICY "fleet_prices_read" ON product_prices
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'sales' OR 
  get_user_role() = 'fleet' OR
  get_user_role() = 'accountant' OR
  get_user_role() = 'admin'
);

CREATE POLICY "fleet_shipment_products_read" ON shipment_products
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'sales' OR 
  get_user_role() = 'fleet' OR
  get_user_role() = 'accountant' OR
  get_user_role() = 'admin'
);

-- 6. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_products ENABLE ROW LEVEL SECURITY;

-- 7. Create a diagnostic function to help debug authentication issues
CREATE OR REPLACE FUNCTION diagnose_auth()
RETURNS JSON AS $$
DECLARE
  result JSON;
  current_user_id UUID;
  user_role TEXT;
  auth_context JSON;
BEGIN
  -- Get auth context
  current_user_id := auth.uid();
  user_role := get_user_role();
  
  -- Build diagnostic result
  result := json_build_object(
    'current_user_id', current_user_id,
    'user_role', user_role,
    'is_authenticated', current_user_id IS NOT NULL,
    'auth_jwt_claims', auth.jwt(),
    'timestamp', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for fleet users to use these functions
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION diagnose_auth() TO authenticated;