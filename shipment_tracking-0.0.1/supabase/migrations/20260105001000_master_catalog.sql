-- Create Master Products Table
CREATE TABLE public.master_products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    unit_type text NOT NULL, -- 'kilo', 'carton', 'piece'
    default_price numeric(10, 2) NOT NULL DEFAULT 0,
    weight_kg numeric(10, 3) DEFAULT 1.0, -- Default weight for calculations
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT master_products_pkey PRIMARY KEY (id)
);

-- Create Master Regions Table (e.g. Standard Zones)
CREATE TABLE public.master_regions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT master_regions_pkey PRIMARY KEY (id)
);

-- Add master_source_id to Tenant Tables
ALTER TABLE public.products 
ADD COLUMN master_source_id uuid REFERENCES public.master_products(id) ON DELETE SET NULL;

ALTER TABLE public.regions 
ADD COLUMN master_source_id uuid REFERENCES public.master_regions(id) ON DELETE SET NULL;


-- RLS Policies for Master Products
ALTER TABLE public.master_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage master products" 
ON public.master_products
FOR ALL 
TO authenticated 
USING (is_super_admin());

CREATE POLICY "Authenticated users can read master products" 
ON public.master_products
FOR SELECT 
TO authenticated 
USING (true); -- All authenticated users (tenants) can see the catalog to import from


-- RLS Policies for Master Regions
ALTER TABLE public.master_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage master regions" 
ON public.master_regions
FOR ALL 
TO authenticated 
USING (is_super_admin());

CREATE POLICY "Authenticated users can read master regions" 
ON public.master_regions
FOR SELECT 
TO authenticated 
USING (true);


-- Indexes
CREATE INDEX idx_products_master_source ON public.products(master_source_id);
CREATE INDEX idx_regions_master_source ON public.regions(master_source_id);

-- Triggers for updated_at
CREATE TRIGGER update_master_products_modtime
    BEFORE UPDATE ON public.master_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_regions_modtime
    BEFORE UPDATE ON public.master_regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
