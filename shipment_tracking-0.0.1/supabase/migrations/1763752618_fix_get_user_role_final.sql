-- Migration: fix_get_user_role_final
-- Created at: 1763752618

-- Migration: fix_get_user_role_final
-- Fix the get_user_role function to properly read from JSON metadata

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    current_user_id UUID;
    raw_meta JSONB;
BEGIN
    current_user_id := auth.uid();
    
    -- If no user is authenticated, return empty string
    IF current_user_id IS NULL THEN
        RETURN '';
    END IF;
    
    -- Get raw_user_meta_data
    SELECT raw_user_meta_data INTO raw_meta
    FROM auth.users 
    WHERE id = current_user_id;
    
    -- Extract role from JSONB metadata
    IF raw_meta IS NOT NULL THEN
        user_role := raw_meta ->> 'role';
    END IF;
    
    -- If role not found in metadata, try JWT token
    IF user_role IS NULL OR user_role = '' THEN
        BEGIN
            user_role := (auth.jwt() ->> 'user_role');
        EXCEPTION WHEN OTHERS THEN
            user_role := NULL;
        END;
    END IF;
    
    RETURN COALESCE(user_role, '');
END;
$$;;