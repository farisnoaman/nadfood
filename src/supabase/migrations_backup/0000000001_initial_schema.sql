-- Initial Schema for Shipment Tracking System
-- This migration creates all base tables required for the application

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('مسؤول الحركة', 'محاسب', 'ادمن', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Service role can manage users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  weight_kg NUMERIC
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.products
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- DRIVERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.drivers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.drivers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.drivers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.drivers
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- REGIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  diesel_liter_price NUMERIC,
  diesel_liters NUMERIC,
  zaitri_fee NUMERIC,
  road_expenses NUMERIC DEFAULT 0
);

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.regions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.regions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.regions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.regions
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- PRODUCT PRICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_prices (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  region_id TEXT REFERENCES public.regions(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  effective_from DATE DEFAULT CURRENT_DATE
);

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.product_prices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.product_prices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.product_prices
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.product_prices
  FOR DELETE USING (auth.role() = 'authenticated');

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
  modified_by TEXT,
  modified_at TIMESTAMP WITH TIME ZONE,
  deductions_edited_by TEXT,
  deductions_edited_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  has_missing_prices BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  notes TEXT,
  attachment_url TEXT
);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.shipments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.shipments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.shipments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.shipments
  FOR DELETE USING (auth.role() = 'authenticated');

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

CREATE POLICY "Allow read for authenticated users" ON public.shipment_products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.shipment_products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.shipment_products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.shipment_products
  FOR DELETE USING (auth.role() = 'authenticated');

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
  target_user_ids TEXT[]
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.notifications
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- APP SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.app_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.app_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.app_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  created_by TEXT,
  updated_by TEXT
);

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.installments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.installments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.installments
  FOR UPDATE USING (auth.role() = 'authenticated');

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  created_by TEXT
);

ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.installment_payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.installment_payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- DEDUCTION PRICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.deduction_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  shortage_price NUMERIC NOT NULL DEFAULT 0,
  damaged_price NUMERIC NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE(product_id, effective_from)
);

ALTER TABLE public.deduction_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.deduction_prices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.deduction_prices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.deduction_prices
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.deduction_prices
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- SYNC LOG TABLE (for offline support)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  data JSONB,
  user_id TEXT,
  device_id TEXT,
  synced BOOLEAN DEFAULT false,
  conflict_resolved BOOLEAN DEFAULT false,
  sync_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sync log" ON public.sync_log
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert sync log" ON public.sync_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_id_param UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result_role TEXT;
BEGIN
  SELECT role INTO result_role 
  FROM public.users 
  WHERE id = COALESCE(user_id_param, auth.uid());
  RETURN COALESCE(result_role, 'unknown');
END;
$$;
