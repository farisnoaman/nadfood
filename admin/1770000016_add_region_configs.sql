-- Create region_configs table for versioning
CREATE TABLE IF NOT EXISTS public.region_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id TEXT REFERENCES public.regions(id) ON DELETE CASCADE,
    diesel_liter_price NUMERIC NOT NULL DEFAULT 0,
    diesel_liters NUMERIC NOT NULL DEFAULT 0,
    zaitri_fee NUMERIC NOT NULL DEFAULT 0,
    road_expenses NUMERIC NOT NULL DEFAULT 0,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(region_id, effective_from)
);

-- Enable RLS
ALTER TABLE public.region_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read for authenticated users" ON public.region_configs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.region_configs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.region_configs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.region_configs
  FOR DELETE USING (auth.role() = 'authenticated');

-- Migrate existing data from regions to region_configs
INSERT INTO public.region_configs (region_id, diesel_liter_price, diesel_liters, zaitri_fee, road_expenses, effective_from)
SELECT id, COALESCE(diesel_liter_price, 0), COALESCE(diesel_liters, 0), COALESCE(zaitri_fee, 0), COALESCE(road_expenses, 0), '2020-01-01'
FROM public.regions
ON CONFLICT (region_id, effective_from) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.region_configs IS 'Stores versioned pricing and fees for each region (road expenses, zaitri fee, diesel).';
