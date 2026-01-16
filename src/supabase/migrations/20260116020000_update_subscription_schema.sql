-- Migration: Update subscription schema with max_shipments and specific plan values

-- 1. Add max_shipments column
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS max_shipments INTEGER;

-- 2. Update Bronze plan with specific values
UPDATE public.subscription_plans
SET 
  monthly_price = 5000,
  bi_annual_price = 25000,  -- 5000 * 5
  annual_price = 50000,     -- 5000 * 10
  max_users = 3,
  max_drivers = 5,
  max_products = 5,
  max_storage_mb = 20,
  max_shipments = 30
WHERE name = 'Bronze';

-- 3. Update Silver plan with estimated values
UPDATE public.subscription_plans
SET 
  monthly_price = 10000,
  bi_annual_price = 50000,  -- 10000 * 5
  annual_price = 100000,    -- 10000 * 10
  max_users = 10,
  max_drivers = 20,
  max_products = 100,
  max_storage_mb = 100,
  max_shipments = 300
WHERE name = 'Silver';

-- 4. Update Gold plan (Unlimited tier)
UPDATE public.subscription_plans
SET 
  monthly_price = 13000,
  bi_annual_price = 65000,  -- 13000 * 5
  annual_price = 130000,    -- 13000 * 10
  max_users = NULL,         -- Unlimited
  max_drivers = NULL,       -- Unlimited
  max_products = NULL,      -- Unlimited
  max_storage_mb = 1024,    -- 1 GB
  max_shipments = NULL      -- Unlimited
WHERE name = 'Gold';

-- 5. Add max_regions column if not exists and update
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS max_regions INTEGER;

UPDATE public.subscription_plans SET max_regions = 5 WHERE name = 'Bronze';
UPDATE public.subscription_plans SET max_regions = 20 WHERE name = 'Silver';
UPDATE public.subscription_plans SET max_regions = NULL WHERE name = 'Gold';

-- 6. Add or Update Free Trial Plan
INSERT INTO public.subscription_plans (name, description, max_users, max_products, max_drivers, max_regions, max_storage_mb, max_shipments, monthly_price, bi_annual_price, annual_price, is_active)
VALUES 
  ('Free Trial', 'تجربة مجانية لمدة 7 أيام', 3, 5, 5, 5, 5, 10, 0, 0, 0, true)
ON CONFLICT (name) DO UPDATE SET
  description = 'تجربة مجانية لمدة 7 أيام',
  max_users = 3,
  max_products = 5,
  max_drivers = 5,
  max_regions = 5,
  max_storage_mb = 5,
  max_shipments = 10,
  monthly_price = 0,
  bi_annual_price = 0,
  annual_price = 0;
