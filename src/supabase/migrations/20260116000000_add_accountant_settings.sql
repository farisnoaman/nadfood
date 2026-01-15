-- ============================================================
-- ADD ACCOUNTANT WORKFLOW SETTINGS & SHIPMENT TRACKING COLUMN
-- ============================================================
-- Adds columns to company_settings for accountant section access
-- Adds last_updated_role column to shipments for draft filtering

-- ============================================
-- ADD NEW COLUMNS TO company_settings
-- ============================================
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS accountant_deductions_access BOOLEAN DEFAULT false;

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS accountant_additions_access BOOLEAN DEFAULT false;

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS accountant_transfer_access BOOLEAN DEFAULT false;

-- ============================================
-- ADD last_updated_role TO shipments
-- ============================================
-- This tracks which role last modified the shipment,
-- enabling accurate filtering of accountant drafts vs admin drafts.
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS last_updated_role TEXT;

COMMENT ON COLUMN public.shipments.last_updated_role IS 'The role of the user who last updated this shipment (e.g., محاسب, ادمن)';
