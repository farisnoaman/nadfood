-- ============================================
-- FINAL ROBUST USER CREATION WITH DEBUG LOGGING
-- Includes Email and Company ID Mapping with Debug Info
-- ============================================

-- 1. User Profile Trigger with Debug Logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_username TEXT;
  extracted_role TEXT;
  raw_company_id TEXT;
  valid_company_id UUID;
BEGIN
  -- 1. Extract values with fallbacks
  extracted_username := COALESCE(
    new.raw_user_meta_data->>'username', 
    split_part(new.email, '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );

  extracted_role := COALESCE(
    new.raw_user_meta_data->>'role',
    'مسؤول الحركة'
  );

  -- 2. Safe UUID cast for company_id with debug logging
  raw_company_id := new.raw_user_meta_data->>'company_id';
  
  -- Debug: Log the raw company_id value
  RAISE NOTICE 'handle_new_user: raw_company_id from metadata = %', raw_company_id;
  
  -- Attempt to cast to UUID
  BEGIN
    IF raw_company_id IS NOT NULL AND raw_company_id != '' THEN
      valid_company_id := raw_company_id::uuid;
      RAISE NOTICE 'handle_new_user: Successfully cast company_id to UUID = %', valid_company_id;
    ELSE
      valid_company_id := NULL;
      RAISE NOTICE 'handle_new_user: company_id is NULL or empty';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user: Failed to cast company_id, error: %', SQLERRM;
    valid_company_id := NULL;
  END;

  -- 3. INSERT/UPDATE with Email and Company ID
  INSERT INTO public.users (id, username, email, role, company_id, is_active)
  VALUES (
    new.id,
    extracted_username,
    new.email,
    extracted_role,
    valid_company_id,
    COALESCE((new.raw_user_meta_data->>'is_active')::boolean, true)
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    is_active = EXCLUDED.is_active;

  RAISE NOTICE 'handle_new_user: User created/updated with company_id = %', valid_company_id;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the auth operation
  RAISE NOTICE 'handle_new_user: Exception occurred: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Lenient Quota Enforcement (unchanged)
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

  IF target_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT plan_id INTO company_plan_id FROM public.companies WHERE id = target_company_id;
  
  IF company_plan_id IS NULL THEN
     RETURN NEW;
  END IF;

  SELECT * INTO plan_record FROM public.subscription_plans WHERE id = company_plan_id;

  IF resource_type = 'users' THEN
    limit_val := plan_record.max_users;
  ELSIF resource_type = 'products' THEN
    limit_val := plan_record.max_products;
  ELSIF resource_type = 'drivers' THEN
    limit_val := plan_record.max_drivers;
  END IF;

  IF limit_val IS NULL THEN
    RETURN NEW;
  END IF;

  EXECUTE format('SELECT count(*) FROM public.%I WHERE company_id = $1', TG_TABLE_NAME) 
  INTO current_count 
  USING target_company_id;

  IF current_count >= limit_val THEN
    RAISE EXCEPTION 'Plan quota exceeded for %. Limit: %, Current: %', resource_type, limit_val, current_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
