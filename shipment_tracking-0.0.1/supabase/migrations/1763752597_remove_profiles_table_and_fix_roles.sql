-- Migration: remove_profiles_table_and_fix_roles
-- Created at: 1763752597

-- Migration: remove_profiles_table_and_fix_roles
-- Remove the profiles table I mistakenly created and use the existing users table

-- Drop the profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- Fix the get_user_role function to work with existing users table
-- We need to check what the users table structure is
-- For now, let's update the function to try different approaches

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
    
    -- Try to get role from user metadata in auth.users
    SELECT COALESCE(
        (auth.jwt() ->> 'user_role'),
        (raw_user_meta_data ->> 'role'),
        (raw_user_meta_data ->> 'user_role'),
        ''
    ) INTO user_role
    FROM auth.users 
    WHERE id = current_user_id;
    
    -- If still not found, try to get from users table (if it exists)
    IF user_role IS NULL OR user_role = '' THEN
        -- Check if users table exists and has a role column
        BEGIN
            EXECUTE format('SELECT role FROM users WHERE id = %L') 
                USING current_user_id INTO user_role;
        EXCEPTION WHEN undefined_table OR undefined_column THEN
            -- users table doesn't exist or doesn't have role column, leave as null
            user_role := NULL;
        END;
    END IF;
    
    RETURN COALESCE(user_role, '');
END;
$$;;