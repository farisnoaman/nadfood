-- Migration: fix_get_user_role_function_v2
-- Created at: 1763752456

-- Migration: fix_get_user_role_function_v2
-- This migration creates a working get_user_role function

-- ============================================
-- CREATE A SIMPLIFIED GET_USER_ROLE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- If no user is authenticated, return empty string
    IF current_user_id IS NULL THEN
        RETURN '';
    END IF;
    
    -- Get role from profiles table (this is the most reliable source)
    SELECT role INTO user_role 
    FROM profiles 
    WHERE id = current_user_id;
    
    RETURN COALESCE(user_role, '');
END;
$$;;