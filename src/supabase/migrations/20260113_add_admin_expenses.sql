-- Add admin_expenses column to regions and region_configs
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS admin_expenses NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.region_configs ADD COLUMN IF NOT EXISTS admin_expenses NUMERIC NOT NULL DEFAULT 0;

-- Update existing configs to have 0 admin_expenses (already handled by DEFAULT)
-- Add comment
COMMENT ON COLUMN public.regions.admin_expenses IS 'Default administrative expenses for this region';
COMMENT ON COLUMN public.region_configs.admin_expenses IS 'Versioned administrative expenses for this region';
