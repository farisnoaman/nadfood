
-- Test inserting a company with pending_payment status to verify constraints
DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Get a paid plan ID (assuming one exists, or use any id)
  SELECT id INTO v_plan_id FROM public.subscription_plans WHERE monthly_price > 0 LIMIT 1;
  
  -- If no paid plan, try any plan
  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id FROM public.subscription_plans LIMIT 1;
  END IF;

  -- Attempt insert
  INSERT INTO public.companies (
    name, 
    slug, 
    plan_id, 
    is_active, 
    payment_status,
    created_at
  ) VALUES (
    'Test Pending Company', 
    'test-pending-' || floor(random() * 1000)::text, 
    v_plan_id, 
    true, 
    'pending_payment',
    now()
  );
  
  RAISE NOTICE 'Insert successful for pending_payment';
  
  -- Rollback to cleanup
  RAISE EXCEPTION 'Test Complete (Rollback)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error during insert: %', SQLERRM;
END $$;
