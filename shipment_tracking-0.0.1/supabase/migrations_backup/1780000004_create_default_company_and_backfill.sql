-- Create default company and backfill all existing data
-- This ensures no data loss during multi-tenancy migration

-- Insert default company (using deterministic UUID for idempotency)
INSERT INTO public.companies (id, name, slug, brand_color)
VALUES ('00000000-0000-0000-0000-000000000001', 'بلغيث للنقل', 'balgaith', '#3b82f6')
ON CONFLICT (slug) DO NOTHING;

-- Backfill all existing data with the default company_id
UPDATE public.users 
SET company_id = '00000000-0000-0000-0000-000000000001' 
WHERE company_id IS NULL;

UPDATE public.products 
SET company_id = '00000000-0000-0000-0000-000000000001' 
WHERE company_id IS NULL;

UPDATE public.drivers 
SET company_id = '00000000-0000-0000-0000-000000000001' 
WHERE company_id IS NULL;

UPDATE public.regions 
SET company_id = '00000000-0000-0000-0000-000000000001' 
WHERE company_id IS NULL;

UPDATE public.shipments 
SET company_id = '00000000-0000-0000-0000-000000000001' 
WHERE company_id IS NULL;

UPDATE public.product_prices 
SET company_id = '00000000-0000-0000-0000-000000000001' 
WHERE company_id IS NULL;

UPDATE public.deduction_prices 
SET company_id = '00000000-0000-0000-0000-000000000001' 
WHERE company_id IS NULL;

UPDATE public.installments 
SET company_id = '00000000-0000-0000-0000-000000000001' 
WHERE company_id IS NULL;

UPDATE public.installment_payments 
SET company_id = '00000000-0000-0000-0000-000000000001' 
WHERE company_id IS NULL;

UPDATE public.app_settings 
SET company_id = '00000000-0000-0000-0000-000000000001' 
WHERE company_id IS NULL;

-- Log completion
DO $$
DECLARE
  user_count INTEGER;
  shipment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users WHERE company_id = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO shipment_count FROM public.shipments WHERE company_id = '00000000-0000-0000-0000-000000000001';
  RAISE NOTICE 'Migration complete: % users, % shipments assigned to default company', user_count, shipment_count;
END $$;
