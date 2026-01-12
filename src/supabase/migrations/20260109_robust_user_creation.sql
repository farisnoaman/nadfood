-- ============================================
-- ROBUST USER CREATION & QUOTA FIXES
-- ============================================

-- 1. Refined User Profile Trigger with Fallbacks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_username TEXT;
  extracted_role TEXT;
BEGIN
  -- Extract and fallback for username (NOT NULL column)
  extracted_username := COALESCE(
    new.raw_user_meta_data->>'username', 
    split_part(new.email, '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );

  -- Extract and fallback for role (NOT NULL column)
  extracted_role := COALESCE(
    new.raw_user_meta_data->>'role',
    'مسؤول الحركة'
  );

  INSERT INTO public.users (id, username, role, company_id, is_active)
  VALUES (
    new.id,
    extracted_username,
    extracted_role,
    (new.raw_user_meta_data->>'company_id')::uuid,
    COALESCE((new.raw_user_meta_data->>'is_active')::boolean, true)
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    is_active = EXCLUDED.is_active;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Lenient Quota Enforcement
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
    RETURN NEW;
  END IF;

  -- Skip check if no company_id (e.g. super admins or during setup)
  IF target_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get Company's Plan
  SELECT plan_id INTO company_plan_id FROM public.companies WHERE id = target_company_id;
  
  -- Lenient: If no plan, assume unlimited/free for now to prevent system-wide crash
  IF company_plan_id IS NULL THEN
     RETURN NEW;
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
