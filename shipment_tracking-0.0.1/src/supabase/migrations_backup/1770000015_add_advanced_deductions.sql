-- Add advanced deduction system: punishment prices and itemized product deductions

-- Step 1: Create Deduction Prices Table
CREATE TABLE IF NOT EXISTS public.deduction_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  shortage_price NUMERIC NOT NULL DEFAULT 0,
  damaged_price NUMERIC NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(product_id, effective_from)
);

-- Enable RLS on deduction_prices
ALTER TABLE public.deduction_prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deduction_prices
CREATE POLICY "Allow read for authenticated users" ON public.deduction_prices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.deduction_prices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.deduction_prices
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.deduction_prices
  FOR DELETE USING (auth.role() = 'authenticated');

-- Step 2: Extend shipment_products with deduction fields
-- Note: shipment_products is a JSONB array inside shipments, so we don't ALTER TABLE.
-- Instead, we will handle this at the application level in TypeScript.

-- Add a comment to document the expected structure
COMMENT ON TABLE public.deduction_prices IS 'Stores punishment prices for shortage and damaged products.';
