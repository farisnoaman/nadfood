-- Add company_id to all data tables for multi-tenancy

-- Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);

-- Drivers
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON public.drivers(company_id);

-- Regions
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
CREATE INDEX IF NOT EXISTS idx_regions_company_id ON public.regions(company_id);

-- Shipments
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
CREATE INDEX IF NOT EXISTS idx_shipments_company_id ON public.shipments(company_id);

-- Product Prices
ALTER TABLE public.product_prices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
CREATE INDEX IF NOT EXISTS idx_product_prices_company_id ON public.product_prices(company_id);

-- Deduction Prices
ALTER TABLE public.deduction_prices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
CREATE INDEX IF NOT EXISTS idx_deduction_prices_company_id ON public.deduction_prices(company_id);

-- Installments
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
CREATE INDEX IF NOT EXISTS idx_installments_company_id ON public.installments(company_id);

-- Installment Payments
ALTER TABLE public.installment_payments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_company_id ON public.installment_payments(company_id);

-- App Settings
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
CREATE INDEX IF NOT EXISTS idx_app_settings_company_id ON public.app_settings(company_id);

-- Documentation
COMMENT ON COLUMN public.products.company_id IS 'Tenant isolation: products belong to a company';
COMMENT ON COLUMN public.shipments.company_id IS 'Tenant isolation: shipments belong to a company';
