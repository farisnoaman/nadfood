-- Migration: create_debug_function
-- Created at: 1763752469

-- Migration: create_debug_function
-- Create a debug function to see what's happening

CREATE OR REPLACE FUNCTION debug_user_info()
RETURNS TABLE(user_id UUID, auth_uid UUID, profile_role TEXT, function_role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    profile_role_val TEXT;
BEGIN
    -- Get current user ID from context
    current_user_id := auth.uid();
    
    -- Get profile role
    SELECT role INTO profile_role_val
    FROM profiles 
    WHERE id = current_user_id;
    
    -- Return debug info
    RETURN QUERY SELECT 
        current_user_id,
        current_user_id,
        COALESCE(profile_role_val, 'NO PROFILE'),
        get_user_role();
END;
$$;;