-- Update RLS policies for multi-tenancy
-- All data tables should only allow access to rows matching user's company_id

-- Helper function to get current user's company_id (cached for performance)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

-- Check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- ============ PRODUCTS ============
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.products;

CREATE POLICY "Tenant isolation: read products" ON public.products
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Tenant isolation: insert products" ON public.products
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Tenant isolation: update products" ON public.products
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Tenant isolation: delete products" ON public.products
  FOR DELETE USING (company_id = public.get_user_company_id());

-- ============ REGIONS ============
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.regions;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.regions;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.regions;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.regions;

CREATE POLICY "Tenant isolation: read regions" ON public.regions
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Tenant isolation: insert regions" ON public.regions
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Tenant isolation: update regions" ON public.regions
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Tenant isolation: delete regions" ON public.regions
  FOR DELETE USING (company_id = public.get_user_company_id());

-- ============ DRIVERS ============
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.drivers;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.drivers;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.drivers;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.drivers;
DROP POLICY IF EXISTS "Admin can manage drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admin can insert drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admin can update drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admin can delete drivers" ON public.drivers;

CREATE POLICY "Tenant isolation: read drivers" ON public.drivers
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Tenant isolation: insert drivers" ON public.drivers
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Tenant isolation: update drivers" ON public.drivers
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Tenant isolation: delete drivers" ON public.drivers
  FOR DELETE USING (company_id = public.get_user_company_id());

-- ============ DEDUCTION PRICES ============
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.deduction_prices;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.deduction_prices;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.deduction_prices;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.deduction_prices;

CREATE POLICY "Tenant isolation: read deduction_prices" ON public.deduction_prices
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Tenant isolation: insert deduction_prices" ON public.deduction_prices
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Tenant isolation: update deduction_prices" ON public.deduction_prices
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Tenant isolation: delete deduction_prices" ON public.deduction_prices
  FOR DELETE USING (company_id = public.get_user_company_id());

-- ============ PRODUCT PRICES ============
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.product_prices;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.product_prices;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.product_prices;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.product_prices;

CREATE POLICY "Tenant isolation: read product_prices" ON public.product_prices
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Tenant isolation: insert product_prices" ON public.product_prices
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Tenant isolation: update product_prices" ON public.product_prices
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Tenant isolation: delete product_prices" ON public.product_prices
  FOR DELETE USING (company_id = public.get_user_company_id());
