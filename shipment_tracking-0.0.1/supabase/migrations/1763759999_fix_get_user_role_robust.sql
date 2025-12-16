-- Migration: fix_get_user_role_robust
-- Create a robust get_user_role function that handles auth context issues

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    current_user_id UUID;
    raw_meta JSONB;
    jwt_token JSONB;
BEGIN
    -- Try multiple methods to get user ID
    current_user_id := auth.uid();
    
    -- If auth.uid() returns null, try alternative methods
    IF current_user_id IS NULL THEN
        -- Try to get from current_setting
        BEGIN
            current_user_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
        EXCEPTION WHEN OTHERS THEN
            -- Try to get from session
            BEGIN
                SELECT id INTO current_user_id 
                FROM auth.users 
                WHERE email = (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
                LIMIT 1;
            EXCEPTION WHEN OTHERS THEN
                current_user_id := NULL;
            END;
        END;
    END IF;
    
    -- If still no user ID, return empty string
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
            jwt_token := auth.jwt();
            IF jwt_token IS NOT NULL THEN
                user_role := jwt_token ->> 'user_role';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            user_role := NULL;
        END;
    END IF;
    
    -- Final fallback: try to get role from users table if we have user ID
    IF (user_role IS NULL OR user_role = '') AND current_user_id IS NOT NULL THEN
        BEGIN
            SELECT role::TEXT INTO user_role
            FROM users 
            WHERE id = current_user_id;
        EXCEPTION WHEN OTHERS THEN
            user_role := '';
        END;
    END IF;
    
    RETURN COALESCE(user_role, '');
END;
$$;