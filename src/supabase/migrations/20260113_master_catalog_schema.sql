-- ============================================================
-- MASTER CATALOG INTEGRATION - SCHEMA UPDATES
-- Adds reference fields to link company products/regions to master catalog
-- ============================================================

-- ============================================
-- STEP 1: Add Master Reference Fields to Products
-- ============================================
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS master_product_id UUID REFERENCES public.master_products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT true;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_master_id ON public.products(master_product_id);

-- Add comment for documentation
COMMENT ON COLUMN public.products.master_product_id IS 'Reference to master catalog product. NULL for custom company products.';
COMMENT ON COLUMN public.products.is_custom IS 'TRUE if product is company-specific, FALSE if linked to master catalog.';

-- ============================================
-- STEP 2: Add Master Reference Fields to Regions
-- ============================================
ALTER TABLE public.regions 
ADD COLUMN IF NOT EXISTS master_region_id UUID REFERENCES public.master_regions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT true;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_regions_master_id ON public.regions(master_region_id);

-- Add comment for documentation
COMMENT ON COLUMN public.regions.master_region_id IS 'Reference to master catalog region. NULL for custom company regions.';
COMMENT ON COLUMN public.regions.is_custom IS 'TRUE if region is company-specific, FALSE if linked to master catalog.';

-- ============================================
-- STEP 3: Enhance Master Products Table
-- ============================================
ALTER TABLE public.master_products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());

-- Add index for active products
CREATE INDEX IF NOT EXISTS idx_master_products_active ON public.master_products(is_active);

-- ============================================
-- STEP 4: Enhance Master Regions Table
-- ============================================
ALTER TABLE public.master_regions
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS region_code TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());

-- Add unique constraint for region code (if provided)
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_regions_code ON public.master_regions(region_code) WHERE region_code IS NOT NULL;

-- Add index for active regions
CREATE INDEX IF NOT EXISTS idx_master_regions_active ON public.master_regions(is_active);

-- ============================================
-- STEP 5: Mark Existing Data as Custom
-- ============================================
-- All existing products and regions are company-specific (custom)
-- This ensures backward compatibility

UPDATE public.products 
SET is_custom = true, 
    master_product_id = NULL 
WHERE is_custom IS NULL OR master_product_id IS NOT NULL;

UPDATE public.regions 
SET is_custom = true, 
    master_region_id = NULL 
WHERE is_custom IS NULL OR master_region_id IS NOT NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Uncomment to verify the migration:

-- SELECT COUNT(*) as total_products, 
--        COUNT(master_product_id) as linked_products,
--        COUNT(*) FILTER (WHERE is_custom = true) as custom_products
-- FROM public.products;

-- SELECT COUNT(*) as total_regions, 
--        COUNT(master_region_id) as linked_regions,
--        COUNT(*) FILTER (WHERE is_custom = true) as custom_regions
-- FROM public.regions;
