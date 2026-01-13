-- ================================================================
-- VERIFICATION SCRIPT: Subscription Limit Enforcement
-- ================================================================
-- This script helps verify that the limits are enforced at the database level.
-- It attempts to insert records beyond the default limits.

DO $$
DECLARE
    v_company_id UUID;
    v_limit_drivers INT;
    v_current_drivers INT;
BEGIN
    -- 1. Get a test company (replace with your actual company ID if needed)
    -- We'll pick the first active company
    SELECT id INTO v_company_id FROM public.companies WHERE is_active = true LIMIT 1;
    
    IF v_company_id IS NULL THEN
        RAISE NOTICE 'No active company found. Please create one first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Testing limits for Company ID: %', v_company_id;

    -- 2. Check current limits
    SELECT 
        (usage_limits->>'maxDrivers')::INT,
        (current_usage->>'drivers')::INT
    INTO 
        v_limit_drivers,
        v_current_drivers
    FROM public.companies WHERE id = v_company_id;

    RAISE NOTICE 'Max Drivers: %, Current Drivers: %', v_limit_drivers, v_current_drivers;

    -- 3. Attempt to insert drivers until we hit the limit
    -- WARN: This will actually create data! Rollback afterwards if testing in prod.
    
    BEGIN
        -- Try adding one more than the limit (looping just in case)
        FOR i IN 1..(v_limit_drivers - v_current_drivers + 1) LOOP
            INSERT INTO public.drivers (company_id, name, plate_number, is_active)
            VALUES (v_company_id, 'Limit Test Driver ' || i, 'TEST-' || i, true);
            
            RAISE NOTICE 'Inserted Driver %', i;
        END LOOP;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: Database rejected insertion with error: %', SQLERRM;
        -- Expected error: "Limit reached for drivers..."
    END;

    -- 4. Verify that the count did not exceed the limit
    SELECT (current_usage->>'drivers')::INT 
    INTO v_current_drivers 
    FROM public.companies WHERE id = v_company_id;
    
    RAISE NOTICE 'Final Driver Count: %', v_current_drivers;
    
    IF v_current_drivers <= v_limit_drivers THEN
        RAISE NOTICE 'VERIFICATION PASSED: Drivers count checks out.';
    ELSE
        RAISE EXCEPTION 'VERIFICATION FAILED: Drivers exceeded limit!';
    END IF;

END $$;
