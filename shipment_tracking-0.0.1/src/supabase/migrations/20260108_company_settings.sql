-- ============================================================
-- COMPANY SETTINGS TABLE (Column-Based)
-- ============================================================
-- Each company has ONE row with all settings as columns
-- This replaces the key-value app_settings approach

CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- App & Company Branding
  app_name TEXT DEFAULT 'تتبع الشحنات',
  company_name TEXT DEFAULT 'اسم الشركة',
  company_address TEXT DEFAULT 'عنوان الشركة',
  company_phone TEXT DEFAULT '',
  company_logo TEXT DEFAULT '',
  
  -- Feature Toggles
  is_print_header_enabled BOOLEAN DEFAULT true,
  accountant_print_access BOOLEAN DEFAULT false,
  is_time_widget_visible BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON public.company_settings(company_id);

-- Enable Row Level Security
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies first to allow re-running
DROP POLICY IF EXISTS "Users can view own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Admins can update own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Admins can insert own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Super admins can manage all company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Service role full access" ON public.company_settings;

-- Users can view their own company's settings
CREATE POLICY "Users can view own company settings" ON public.company_settings
  FOR SELECT USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  );

-- Admins can update their own company's settings
CREATE POLICY "Admins can update own company settings" ON public.company_settings
  FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ادمن')
  );

-- Admins can insert their own company's settings (needed for upsert if row missing)
CREATE POLICY "Admins can insert own company settings" ON public.company_settings
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ادمن')
  );

-- Super admins can manage all settings
CREATE POLICY "Super admins can manage all company settings" ON public.company_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Service role has full access (for Edge Functions)
CREATE POLICY "Service role full access" ON public.company_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_company_settings_updated_at ON public.company_settings;
CREATE TRIGGER trigger_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();

-- Migrate existing data from app_settings if any exists
-- This creates a settings row for each company that doesn't have one yet
DO $$
DECLARE
  comp RECORD;
BEGIN
  FOR comp IN SELECT id, name FROM public.companies LOOP
    INSERT INTO public.company_settings (company_id, app_name, company_name)
    VALUES (comp.id, comp.name, comp.name)
    ON CONFLICT (company_id) DO NOTHING;
  END LOOP;
END $$;
