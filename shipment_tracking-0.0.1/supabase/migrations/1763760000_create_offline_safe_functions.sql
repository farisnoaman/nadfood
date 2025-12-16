-- Migration: create_offline_safe_functions
-- Create functions that work without auth context for offline scenarios

-- Function to get user role without relying on auth.uid()
CREATE OR REPLACE FUNCTION get_user_role_safe(user_id_param UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    target_user_id UUID;
BEGIN
    -- Use provided user_id or try to get from auth context
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    -- If no user ID, return empty string
    IF target_user_id IS NULL THEN
        RETURN '';
    END IF;
    
    -- Try to get role from users table directly
    SELECT role::TEXT INTO user_role
    FROM users 
    WHERE id = target_user_id;
    
    RETURN COALESCE(user_role, '');
END;
$$;

-- Function to check if user exists without auth context
CREATE OR REPLACE FUNCTION user_exists_safe(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id_param AND is_active = true
    );
END;
$$;

-- Update RLS policies to use the safe functions

-- Users table policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        user_exists_safe(auth.uid()) OR
        get_user_role_safe(auth.uid()) IN ('admin', 'sales', 'accountant', 'fleet')
    );

-- Shipments policies
DROP POLICY IF EXISTS "Sales can view shipments" ON shipments;
CREATE POLICY "Sales can view shipments" ON shipments
    FOR SELECT USING (
        get_user_role_safe(auth.uid()) = 'admin' OR
        get_user_role_safe(auth.uid()) = 'sales' OR
        get_user_role_safe(auth.uid()) = 'fleet' OR
        get_user_role_safe(auth.uid()) = 'accountant'
    );

DROP POLICY IF EXISTS "Sales can insert shipments" ON shipments;
CREATE POLICY "Sales can insert shipments" ON shipments
    FOR INSERT WITH CHECK (
        get_user_role_safe(auth.uid()) = 'admin' OR
        get_user_role_safe(auth.uid()) = 'sales'
    );

DROP POLICY IF EXISTS "Sales can update shipments" ON shipments;
CREATE POLICY "Sales can update shipments" ON shipments
    FOR UPDATE USING (
        get_user_role_safe(auth.uid()) = 'admin' OR
        get_user_role_safe(auth.uid()) = 'sales' OR
        get_user_role_safe(auth.uid()) = 'fleet'
    );

-- Products policies
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
CREATE POLICY "Authenticated users can view products" ON products
    FOR SELECT USING (
        get_user_role_safe(auth.uid()) != ''
    );

-- Drivers policies
DROP POLICY IF EXISTS "Authenticated users can view drivers" ON drivers;
CREATE POLICY "Authenticated users can view drivers" ON drivers
    FOR SELECT USING (
        get_user_role_safe(auth.uid()) != ''
    );

-- Regions policies
DROP POLICY IF EXISTS "Authenticated users can view regions" ON regions;
CREATE POLICY "Authenticated users can view regions" ON regions
    FOR SELECT USING (
        get_user_role_safe(auth.uid()) != ''
    );

-- Product prices policies
DROP POLICY IF EXISTS "Authenticated users can view product prices" ON product_prices;
CREATE POLICY "Authenticated users can view product prices" ON product_prices
    FOR SELECT USING (
        get_user_role_safe(auth.uid()) != ''
    );

-- Notifications policies
DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
CREATE POLICY "Users can view notifications" ON notifications
    FOR SELECT USING (
        get_user_role_safe(auth.uid()) = 'admin' OR
        target_user_ids @> ARRAY[auth.uid()] OR
        target_roles && ARRAY[get_user_role_safe(auth.uid())]
    );