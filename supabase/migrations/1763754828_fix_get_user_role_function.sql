-- Migration: fix_get_user_role_function
-- Created at: 1763754828

-- Fix the get_user_role function to get role from users table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_role TEXT;
BEGIN
    current_user_id := auth.uid();
    
    -- If no user is authenticated, return empty string
    IF current_user_id IS NULL THEN
        RETURN '';
    END IF;
    
    -- Get role from users table
    SELECT role INTO user_role
    FROM public.users 
    WHERE id = current_user_id;
    
    RETURN COALESCE(user_role, '');
END;
$$;;