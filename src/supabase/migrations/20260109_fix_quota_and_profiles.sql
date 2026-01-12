-- ============================================
-- FIX QUOTA TRIGGER AND PROFILE FETCH
-- Handle NULL company_id in quota check and allow missing profiles
-- ============================================

-- 1. Update Quota Enforcement Function
CREATE OR REPLACE FUNCTION public.check_subscription_quota()
RETURNS TRIGGER AS $$
DECLARE
  company_plan_id UUID;
  plan_record RECORD;
  current_count INTEGER;
  limit_val INTEGER;
  resource_type TEXT;
  target_company_id UUID;
BEGIN
  -- Determine resource type and company_id based on table
  IF TG_TABLE_NAME = 'users' THEN
    resource_type := 'users';
    target_company_id := NEW.company_id;
  ELSIF TG_TABLE_NAME = 'products' THEN
    resource_type := 'products';
    target_company_id := NEW.company_id;
  ELSIF TG_TABLE_NAME = 'drivers' THEN
    resource_type := 'drivers';
    target_company_id := NEW.company_id;
  ELSE
    RETURN NEW; -- Should not happen if trigger is set correctly
  END IF;

  -- NEW: Skip check if no company_id (e.g. super admins or unassigned users)
  IF target_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get Company's Plan
  SELECT plan_id INTO company_plan_id FROM public.companies WHERE id = target_company_id;
  
  IF company_plan_id IS NULL THEN
     RAISE EXCEPTION 'Company has no active subscription plan.';
  END IF;

  SELECT * INTO plan_record FROM public.subscription_plans WHERE id = company_plan_id;

  -- Check Limit based on Resource
  IF resource_type = 'users' THEN
    limit_val := plan_record.max_users;
  ELSIF resource_type = 'products' THEN
    limit_val := plan_record.max_products;
  ELSIF resource_type = 'drivers' THEN
    limit_val := plan_record.max_drivers;
  END IF;

  -- NULL limit means Unlimited
  IF limit_val IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count existing usage
  EXECUTE format('SELECT count(*) FROM public.%I WHERE company_id = $1', TG_TABLE_NAME) 
  INTO current_count 
  USING target_company_id;

  IF current_count >= limit_val THEN
    RAISE EXCEPTION 'Plan quota exceeded for %. Limit: %, Current: %', resource_type, limit_val, current_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
