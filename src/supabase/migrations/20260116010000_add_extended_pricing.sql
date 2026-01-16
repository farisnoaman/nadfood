-- Migration: Add extended pricing to subscription plans
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS bi_annual_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS annual_price NUMERIC DEFAULT 0;

-- Update existing plans with some logic (e.g., 5% discount for bi-annual, 10% for annual)
UPDATE public.subscription_plans
SET 
  bi_annual_price = ROUND(monthly_price * 6 * 0.95),
  annual_price = ROUND(monthly_price * 12 * 0.90)
WHERE monthly_price > 0;
