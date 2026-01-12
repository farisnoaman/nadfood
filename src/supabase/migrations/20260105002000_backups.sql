-- Create Backups Table and Storage Bucket Configuration

-- 1. Create the Backups Table
CREATE TABLE IF NOT EXISTS public.backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    size_bytes BIGINT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable RLS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Super Admins can see/manage ALL backups
CREATE POLICY "Super Admins full access to backups"
    ON public.backups
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Company Admins can see their OWN company backups
CREATE POLICY "Company Admins view own backups"
    ON public.backups
    FOR SELECT
    USING (company_id = public.get_user_company_id());

-- 4. Storage Bucket Configuration (Idempotent insert)
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage Policies (If storage schema is accessible via SQL)
-- Allow Authenticated uploads (We will restrict via Edge Function mainly, but good to have)
-- More strictly: Only specific users. For now, we rely on Edge Function (Service Role) to upload.
-- We need Download policies.

CREATE POLICY "Give access to own folder" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'backups' 
    AND (auth.role() = 'service_role' OR (storage.foldername(name))[1] = public.get_user_company_id()::text)
  );
  
-- Note: 'storage.foldername' might be specific helper. 
-- Alternatively simplier policy:
-- Allow reading if user belongs to the company in the path (path: company_id/filename.json)

