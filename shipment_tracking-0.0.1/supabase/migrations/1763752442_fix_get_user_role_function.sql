-- Migration: fix_get_user_role_function
-- Created at: 1763752442

-- Migration: fix_get_user_role_function
-- This migration fixes the get_user_role function to properly retrieve roles

-- ============================================
-- FIX GET_USER_ROLE FUNCTION
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
    
    -- First try to get role from user metadata in auth.users
    SELECT COALESCE(
        (auth.jwt() ->> 'user_role'),
        (raw_user_meta_data ->> 'role'),
        ''
    ) INTO user_role
    FROM auth.users 
    WHERE id = current_user_id;
    
    -- If not found in metadata, check profiles table
    IF user_role IS NULL OR user_role = '' THEN
        SELECT role INTO user_role 
        FROM profiles 
        WHERE id = current_user_id;
    END IF;
    
    RETURN COALESCE(user_role, '');
END;
$$;;