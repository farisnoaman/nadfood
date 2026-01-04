-- Add company_id to users table for multi-tenancy
-- Also add super_admin role for platform management

-- Add company_id column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Check and update role constraint to include super_admin
DO $$
BEGIN
  -- Drop existing constraint if it exists (various possible names)
  BEGIN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_role;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
END $$;

-- Add new constraint with super_admin role
-- Note: existing roles are Arabic, super_admin is English for platform level
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('مسؤول الحركة', 'محاسب', 'ادمن', 'super_admin'));

-- Index for faster company lookups
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- Comment for documentation
COMMENT ON COLUMN public.users.company_id IS 'References the company this user belongs to. NULL only allowed for super_admin.';
