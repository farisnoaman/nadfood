-- Add unique constraint to shipments table to ensure sales_order is unique per company
-- This prevents duplicates within a tenant while allowing the same order number in different companies.

-- First, drop any existing constraint if it exists (though none was found in schema)
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_sales_order_key;
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_sales_order_company_id_key;

-- Add the composite unique constraint
ALTER TABLE public.shipments ADD CONSTRAINT shipments_sales_order_company_id_key UNIQUE (sales_order, company_id);

-- Verify the change (this part is for manual checking, won't execute in migration runner usually)
-- \d shipments
