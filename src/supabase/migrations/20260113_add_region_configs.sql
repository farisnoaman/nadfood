-- Create region_configs table for versioned regional settings
-- This allows tracking changes to diesel prices, road expenses, etc. over time
CREATE TABLE IF NOT EXISTS public.region_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id TEXT REFERENCES public.regions(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    diesel_liter_price NUMERIC NOT NULL DEFAULT 0,
    diesel_liters NUMERIC NOT NULL DEFAULT 0,
    zaitri_fee NUMERIC NOT NULL DEFAULT 0,
    road_expenses NUMERIC NOT NULL DEFAULT 0,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(region_id, effective_from, company_id)
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
-- This creates an initial config entry for each region based on its current values
INSERT INTO public.region_configs (region_id, company_id, diesel_liter_price, diesel_liters, zaitri_fee, road_expenses, effective_from)
SELECT 
    r.id, 
    r.company_id,
    COALESCE(r.diesel_liter_price, 0), 
    COALESCE(r.diesel_liters, 0), 
    COALESCE(r.zaitri_fee, 0), 
    COALESCE(r.road_expenses, 0), 
    '2020-01-01'
FROM public.regions r
ON CONFLICT (region_id, effective_from, company_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.region_configs IS 'Stores versioned pricing and fees for each region (road expenses, zaitri fee, diesel).';
