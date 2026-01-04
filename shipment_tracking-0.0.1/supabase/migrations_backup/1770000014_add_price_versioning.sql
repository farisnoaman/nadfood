-- Add effective_from column to product_prices
ALTER TABLE public.product_prices 
ADD COLUMN IF NOT EXISTS effective_from DATE NOT NULL DEFAULT CURRENT_DATE;

-- Add comment
COMMENT ON COLUMN public.product_prices.effective_from IS 'The date from which this price becomes active';

-- Drop the old unique constraint (region_id, product_id)
-- First, let's find the constraint name. In Supabase/PostgreSQL it's usually 
-- 'product_prices_region_id_product_id_key' or similar based on standard naming.
-- If it was created manually with a different name, this might need adjustment.
ALTER TABLE public.product_prices 
DROP CONSTRAINT IF EXISTS product_prices_region_id_product_id_key;

-- Add the new unique constraint including effective_from
ALTER TABLE public.product_prices 
ADD CONSTRAINT product_prices_region_id_product_id_effective_from_key 
UNIQUE (region_id, product_id, effective_from);
