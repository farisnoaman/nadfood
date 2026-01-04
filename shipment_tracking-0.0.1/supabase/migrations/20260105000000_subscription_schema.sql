-- ============================================================
-- SUBSCRIPTION & QUOTA SYSTEM
-- ============================================================

-- 1. Create Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_users INTEGER, -- NULL means unlimited
  max_products INTEGER,
  max_drivers INTEGER,
  max_storage_mb INTEGER,
  monthly_price NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow public read of plans (for pricing page)
CREATE POLICY "Public read plans" ON public.subscription_plans FOR SELECT USING (true);

-- Super admin manage plans
CREATE POLICY "Super admin manage plans" ON public.subscription_plans 
  FOR ALL USING (public.is_super_admin());

-- 2. Seed Default Plans
INSERT INTO public.subscription_plans (name, description, max_users, max_products, max_drivers, monthly_price)
VALUES 
  ('Bronze', 'Starter plan for small fleets', 5, 50, 10, 200),
  ('Silver', 'Growing business plan', 20, 500, 50, 500),
  ('Gold', 'Enterprise plan with no limits', NULL, NULL, NULL, 1500)
ON CONFLICT (name) DO NOTHING;

-- 3. Update Companies Table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'trial', 'cancelled')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS master_product_ids TEXT[] DEFAULT '{}'; -- For Phase 2

-- Set default plan for existing companies (Give them Gold/Unlimited or Silver?)
-- Let's give default company 'Gold' to avoid breaking existing usage
DO $$ 
DECLARE
  gold_plan_id UUID;
BEGIN
  SELECT id INTO gold_plan_id FROM public.subscription_plans WHERE name = 'Gold';
  
  UPDATE public.companies 
  SET plan_id = gold_plan_id 
  WHERE plan_id IS NULL;
END $$;

-- 4. Quota Enforcement Function
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

  -- Get Company's Plan
  SELECT plan_id INTO company_plan_id FROM public.companies WHERE id = target_company_id;
  
  -- If no plan, assume blocked or fallback? 
  -- Let's assume strict: No plan = No access (except super admin actions?)
  -- But we backfilled Gold, so it's fine.
  
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
  -- Note: We count specifically for the company
  EXECUTE format('SELECT count(*) FROM public.%I WHERE company_id = $1', TG_TABLE_NAME) 
  INTO current_count 
  USING target_company_id;

  IF current_count >= limit_val THEN
    RAISE EXCEPTION 'Plan quota exceeded for %. Limit: %, Current: %', resource_type, limit_val, current_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Apply Triggers
DROP TRIGGER IF EXISTS check_quota_users ON public.users;
CREATE TRIGGER check_quota_users
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_quota();

DROP TRIGGER IF EXISTS check_quota_products ON public.products;
CREATE TRIGGER check_quota_products
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_quota();

DROP TRIGGER IF EXISTS check_quota_drivers ON public.drivers;
CREATE TRIGGER check_quota_drivers
  BEFORE INSERT ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_quota();
