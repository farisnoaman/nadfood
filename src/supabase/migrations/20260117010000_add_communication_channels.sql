-- Migration: Add communication channels for payment activation
-- Adds admin_phone and preferred_contact_method to companies table

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS admin_phone TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'whatsapp' 
  CHECK (preferred_contact_method IN ('sms', 'call', 'whatsapp'));

-- Add index for phone lookups
CREATE INDEX IF NOT EXISTS idx_companies_admin_phone ON public.companies(admin_phone);

COMMENT ON COLUMN public.companies.admin_phone IS 'Company admin phone number for activation code delivery';
COMMENT ON COLUMN public.companies.preferred_contact_method IS 'Preferred method to contact company admin (sms, call, or whatsapp)';
