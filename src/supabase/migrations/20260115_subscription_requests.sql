-- Create subscription_requests table
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  payment_reference TEXT NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'renewal' CHECK (request_type IN ('renewal', 'upgrade')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Company Admins can INSERT their own requests
CREATE POLICY "Company admins can insert own requests"
ON public.subscription_requests
FOR INSERT
WITH CHECK (company_id = public.get_user_company_id());

-- Company Admins can SELECT their own requests
CREATE POLICY "Company admins can view own requests"
ON public.subscription_requests
FOR SELECT
USING (company_id = public.get_user_company_id());

-- Platform Admins can SELECT all requests
CREATE POLICY "Platform admins can view all requests"
ON public.subscription_requests
FOR SELECT
USING (public.is_super_admin());

-- Platform Admins can UPDATE all requests
CREATE POLICY "Platform admins can update requests"
ON public.subscription_requests
FOR UPDATE
USING (public.is_super_admin());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_subscription_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_subscription_request_timestamp ON public.subscription_requests;
CREATE TRIGGER set_subscription_request_timestamp
BEFORE UPDATE ON public.subscription_requests
FOR EACH ROW EXECUTE FUNCTION public.update_subscription_request_timestamp();
