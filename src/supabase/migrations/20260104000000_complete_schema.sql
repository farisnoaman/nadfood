-- ============================================================
-- COMPLETE MULTI-TENANT SHIPMENT TRACKING SCHEMA
-- For fresh Supabase project deployment
-- ============================================================

-- ============================================
-- COMPANIES TABLE (Multi-tenancy root)
-- ============================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#3b82f6',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_companies_slug ON public.companies(slug);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('مسؤول الحركة', 'محاسب', 'ادمن', 'super_admin')),
  company_id UUID REFERENCES public.companies(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_users_company_id ON public.users(company_id);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  weight_kg NUMERIC,
  company_id UUID REFERENCES public.companies(id)
);

CREATE INDEX idx_products_company_id ON public.products(company_id);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DRIVERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  company_id UUID REFERENCES public.companies(id)
);

CREATE INDEX idx_drivers_company_id ON public.drivers(company_id);
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REGIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  diesel_liter_price NUMERIC,
  diesel_liters NUMERIC,
  zaitri_fee NUMERIC,
  road_expenses NUMERIC DEFAULT 0,
  company_id UUID REFERENCES public.companies(id)
);

CREATE INDEX idx_regions_company_id ON public.regions(company_id);
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCT PRICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_prices (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  region_id TEXT REFERENCES public.regions(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  effective_from DATE DEFAULT CURRENT_DATE,
  company_id UUID REFERENCES public.companies(id)
);

CREATE INDEX idx_product_prices_company_id ON public.product_prices(company_id);
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SHIPMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id TEXT PRIMARY KEY,
  sales_order TEXT NOT NULL,
  order_date DATE NOT NULL,
  entry_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  region_id TEXT REFERENCES public.regions(id),
  driver_id INTEGER REFERENCES public.drivers(id),
  status TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  
  -- Calculated values
  total_diesel NUMERIC,
  total_wage NUMERIC,
  zaitri_fee NUMERIC,
  admin_expenses NUMERIC,
  due_amount NUMERIC,
  
  -- Accountant fields
  damaged_value NUMERIC,
  shortage_value NUMERIC,
  road_expenses NUMERIC,
  due_amount_after_discount NUMERIC,
  
  -- Admin fields
  other_amounts NUMERIC,
  improvement_bonds NUMERIC,
  evening_allowance NUMERIC,
  transfer_fee NUMERIC,
  total_due_amount NUMERIC,
  tax_rate NUMERIC,
  total_tax NUMERIC,
  transfer_number TEXT,
  transfer_date DATE,
  modified_by UUID,
  modified_at TIMESTAMP WITH TIME ZONE,
  deductions_edited_by UUID,
  deductions_edited_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  has_missing_prices BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  notes TEXT,
  attachment_url TEXT
);

CREATE INDEX idx_shipments_company_id ON public.shipments(company_id);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_order_date ON public.shipments(order_date);
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SHIPMENT PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.shipment_products (
  id SERIAL PRIMARY KEY,
  shipment_id TEXT REFERENCES public.shipments(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  carton_count INTEGER NOT NULL,
  product_wage_price NUMERIC,
  shortage_cartons INTEGER DEFAULT 0,
  shortage_exemption_rate NUMERIC DEFAULT 0,
  shortage_value NUMERIC DEFAULT 0,
  damaged_cartons INTEGER DEFAULT 0,
  damaged_exemption_rate NUMERIC DEFAULT 0,
  damaged_value NUMERIC DEFAULT 0
);

ALTER TABLE public.shipment_products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  read BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  target_roles TEXT[],
  target_user_ids UUID[],
  company_id UUID REFERENCES public.companies(id)
);

CREATE INDEX idx_notifications_company_id ON public.notifications(company_id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- APP SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE(setting_key, company_id)
);

CREATE INDEX idx_app_settings_company_id ON public.app_settings(company_id);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INSTALLMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id TEXT REFERENCES public.shipments(id) ON DELETE CASCADE,
  payable_amount NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
  installment_type TEXT CHECK (installment_type IN ('regular', 'debt_collection')),
  original_amount NUMERIC,
  notes TEXT,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_installments_company_id ON public.installments(company_id);
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INSTALLMENT PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.installment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id UUID REFERENCES public.installments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  received_date DATE NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  created_by UUID
);

CREATE INDEX idx_installment_payments_company_id ON public.installment_payments(company_id);
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DEDUCTION PRICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.deduction_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  shortage_price NUMERIC NOT NULL DEFAULT 0,
  damaged_price NUMERIC NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE(product_id, effective_from, company_id)
);

CREATE INDEX idx_deduction_prices_company_id ON public.deduction_prices(company_id);
ALTER TABLE public.deduction_prices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SYNC LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  data JSONB,
  user_id UUID,
  device_id TEXT,
  synced BOOLEAN DEFAULT false,
  conflict_resolved BOOLEAN DEFAULT false,
  sync_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

-- Get user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Check if super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'platform_admin'
  );
$$;

-- ============================================
-- RLS POLICIES - COMPANIES
-- ============================================
CREATE POLICY "Super admin can manage companies" ON public.companies
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can read own company" ON public.companies
  FOR SELECT USING (id = public.get_user_company_id());

-- ============================================
-- RLS POLICIES - USERS
-- ============================================
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Super admin can manage users" ON public.users
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- RLS POLICIES - TENANT DATA (Products, Regions, etc.)
-- ============================================

-- Products
CREATE POLICY "Tenant isolation: read products" ON public.products
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());
CREATE POLICY "Tenant isolation: insert products" ON public.products
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: update products" ON public.products
  FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: delete products" ON public.products
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Drivers
CREATE POLICY "Tenant isolation: read drivers" ON public.drivers
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());
CREATE POLICY "Tenant isolation: insert drivers" ON public.drivers
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: update drivers" ON public.drivers
  FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: delete drivers" ON public.drivers
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Regions
CREATE POLICY "Tenant isolation: read regions" ON public.regions
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());
CREATE POLICY "Tenant isolation: insert regions" ON public.regions
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: update regions" ON public.regions
  FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: delete regions" ON public.regions
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Product Prices
CREATE POLICY "Tenant isolation: read product_prices" ON public.product_prices
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());
CREATE POLICY "Tenant isolation: insert product_prices" ON public.product_prices
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: update product_prices" ON public.product_prices
  FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: delete product_prices" ON public.product_prices
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Deduction Prices
CREATE POLICY "Tenant isolation: read deduction_prices" ON public.deduction_prices
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());
CREATE POLICY "Tenant isolation: insert deduction_prices" ON public.deduction_prices
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: update deduction_prices" ON public.deduction_prices
  FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: delete deduction_prices" ON public.deduction_prices
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Shipments
CREATE POLICY "Tenant isolation: read shipments" ON public.shipments
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());
CREATE POLICY "Tenant isolation: insert shipments" ON public.shipments
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: update shipments" ON public.shipments
  FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: delete shipments" ON public.shipments
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Shipment Products (inherit from shipment's company)
CREATE POLICY "Tenant isolation: read shipment_products" ON public.shipment_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.company_id = public.get_user_company_id())
    OR public.is_super_admin()
  );
CREATE POLICY "Tenant isolation: insert shipment_products" ON public.shipment_products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.company_id = public.get_user_company_id())
  );
CREATE POLICY "Tenant isolation: update shipment_products" ON public.shipment_products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.company_id = public.get_user_company_id())
  );
CREATE POLICY "Tenant isolation: delete shipment_products" ON public.shipment_products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.company_id = public.get_user_company_id())
  );

-- Installments
CREATE POLICY "Tenant isolation: read installments" ON public.installments
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());
CREATE POLICY "Tenant isolation: insert installments" ON public.installments
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: update installments" ON public.installments
  FOR UPDATE USING (company_id = public.get_user_company_id());

-- Installment Payments
CREATE POLICY "Tenant isolation: read installment_payments" ON public.installment_payments
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());
CREATE POLICY "Tenant isolation: insert installment_payments" ON public.installment_payments
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

-- App Settings
CREATE POLICY "Tenant isolation: read app_settings" ON public.app_settings
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());
CREATE POLICY "Tenant isolation: insert app_settings" ON public.app_settings
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Tenant isolation: update app_settings" ON public.app_settings
  FOR UPDATE USING (company_id = public.get_user_company_id());

-- Notifications
CREATE POLICY "Tenant isolation: read notifications" ON public.notifications
  FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_super_admin());

-- Sync Log
CREATE POLICY "Users can read own sync log" ON public.sync_log
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert sync log" ON public.sync_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DEFAULT COMPANY (for demo/initial setup)
-- ============================================
INSERT INTO public.companies (id, name, slug, brand_color)
VALUES ('00000000-0000-0000-0000-000000000001', 'بلغيث للنقل', 'balgaith', '#3b82f6')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- STORAGE BUCKET for company assets
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'company-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-assets');
