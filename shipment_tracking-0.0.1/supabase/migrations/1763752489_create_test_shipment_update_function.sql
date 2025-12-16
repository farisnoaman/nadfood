-- Migration: create_test_shipment_update_function
-- Created at: 1763752489

-- Migration: create_test_shipment_update_function
-- Create a test function to simulate the exact UPDATE scenario

CREATE OR REPLACE FUNCTION test_accountant_update_shipment(
    shipment_id_param TEXT,
    new_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_result JSON;
    user_id_val UUID;
    user_role_val TEXT;
    current_status TEXT;
    can_update BOOLEAN := FALSE;
BEGIN
    -- Get current user ID and role (simulating authenticated user)
    user_id_val := auth.uid();
    user_role_val := get_user_role();
    
    -- Get current shipment status
    SELECT status INTO current_status 
    FROM shipments 
    WHERE id = shipment_id_param;
    
    -- Test the UPDATE policy logic manually
    -- Accountant can update if:
    -- 1. User has 'محاسب' role
    -- 2. Current status is in allowed statuses
    -- 3. New status is in allowed WITH CHECK statuses
    
    IF user_role_val = 'محاسب' THEN
        IF current_status IN ('من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة') THEN
            IF new_status IN ('مرسلة للادمن', 'مسودة', 'مرتجعة لمسؤول الحركة') THEN
                can_update := TRUE;
            END IF;
        END IF;
    END IF;
    
    -- Return test result
    test_result := json_build_object(
        'auth_uid', user_id_val,
        'user_role', user_role_val,
        'current_status', current_status,
        'new_status', new_status,
        'can_update_policy', can_update,
        'debug_info', json_build_object(
            'role_match', (user_role_val = 'محاسب'),
            'current_status_match', (current_status IN ('من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة')),
            'new_status_match', (new_status IN ('مرسلة للادمن', 'مسودة', 'مرتجعة لمسؤول الحركة'))
        )
    );
    
    RETURN test_result;
END;
$$;;