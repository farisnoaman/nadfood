-- Migration: Add payment activation system
-- Adds payment_status tracking and payment_codes table

-- 1. Add payment_status column to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending_payment' 
  CHECK (payment_status IN ('pending_payment', 'active', 'suspended'));

-- 2. Create payment_codes table
CREATE TABLE IF NOT EXISTS public.payment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  is_activated BOOLEAN DEFAULT false,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc', now()) + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. Add indexes
CREATE INDEX idx_payment_codes_company_id ON public.payment_codes(company_id);
CREATE INDEX idx_payment_codes_code ON public.payment_codes(code);

-- 4. Enable RLS
ALTER TABLE public.payment_codes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for payment_codes
CREATE POLICY "Users can read own company payment codes" ON public.payment_codes
  FOR SELECT USING (
    company_id IN (SELECT id FROM public.companies WHERE id = public.get_user_company_id())
  );

CREATE POLICY "Platform admin can manage payment codes" ON public.payment_codes
  FOR ALL USING (public.is_super_admin());

-- 6. Set free trial and existing companies to active
UPDATE public.companies c
SET payment_status = 'active'
WHERE c.plan_id IN (
  SELECT id FROM public.subscription_plans WHERE monthly_price = 0
)
OR c.created_at < timezone('utc', now()); -- All existing companies

-- 7. Add helper function to check payment status
CREATE OR REPLACE FUNCTION public.get_company_payment_status()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT payment_status 
  FROM public.companies 
  WHERE id = public.get_user_company_id();
$$;
