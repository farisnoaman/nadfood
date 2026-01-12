-- ============================================
-- FIX USER RLS POLICIES (UPDATED)
-- Allow Tenant Admins to manage users in their company
-- BUT prohibit creating 'super_admin' roles
-- ============================================

-- 0. Helper Function: Check if user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT public.get_user_role() IN ('ادمن', 'super_admin');
$$;

-- 1. Allow Admins to VIEW all users in their company
CREATE POLICY "Admins can view company users" ON public.users
  FOR SELECT USING (
    (company_id = public.get_user_company_id() AND public.is_admin())
  );

-- 2. Allow Admins to INSERT users into their company
-- RESTRICTION: Cannot create 'super_admin' role
CREATE POLICY "Admins can insert company users" ON public.users
  FOR INSERT WITH CHECK (
    public.is_admin() AND 
    company_id = public.get_user_company_id() AND
    role <> 'super_admin'
  );

-- 3. Allow Admins to UPDATE users in their company
-- RESTRICTION: Cannot update 'super_admin' users, and cannot promote to 'super_admin'
CREATE POLICY "Admins can update company users" ON public.users
  FOR UPDATE 
  USING (
    public.is_admin() AND 
    company_id = public.get_user_company_id() AND
    role <> 'super_admin'
  )
  WITH CHECK (
    public.is_admin() AND 
    company_id = public.get_user_company_id() AND
    role <> 'super_admin'
  );

-- 4. Allow Admins to DELETE users in their company
-- RESTRICTION: Cannot delete 'super_admin' users
CREATE POLICY "Admins can delete company users" ON public.users
  FOR DELETE USING (
    public.is_admin() AND 
    company_id = public.get_user_company_id() AND
    role <> 'super_admin'
  );
