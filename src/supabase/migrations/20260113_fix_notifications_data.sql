-- 1. Fix is_super_admin function to handle BOTH potential platform-admin role names
-- User's data shows 'super_admin', so that must be supported.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'platform_admin')
  );
$$;

-- 2. Update the SELECT policy for notifications to be inclusive of legacy/system data
-- Allows users to see notifications for their company OR notifications with NO company assigned (system-wide)
DROP POLICY IF EXISTS "Tenant isolation: read notifications" ON public.notifications;

CREATE POLICY "Tenant isolation: read notifications" ON public.notifications
  FOR SELECT USING (
    company_id IS NULL OR 
    company_id = public.get_user_company_id() OR 
    public.is_super_admin()
  );

-- 3. Ensure marking as read works for all visible notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE
    USING (
        company_id IS NULL OR 
        company_id = public.get_user_company_id() OR 
        public.is_super_admin()
    )
    WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Clean up any users who might be missing a company_id but are not super admins
-- Assign to the default company '00000000-0000-0000-0000-000000000001'
UPDATE public.users 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL AND NOT (role = 'super_admin' OR role = 'platform_admin');
