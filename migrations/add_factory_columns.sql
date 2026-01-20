-- Migration: Add factory_name to products/master_products and assigned_factory to users
-- Purpose: Enable multi-factory operations within a Company

-- Add factory_name column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS factory_name TEXT;

-- Add factory_name column to master_products table (platform catalog)
ALTER TABLE public.master_products ADD COLUMN IF NOT EXISTS factory_name TEXT;

-- Add assigned_factory column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS assigned_factory TEXT;

-- Add indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_products_factory_name ON public.products(factory_name);
CREATE INDEX IF NOT EXISTS idx_master_products_factory_name ON public.master_products(factory_name);
CREATE INDEX IF NOT EXISTS idx_users_assigned_factory ON public.users(assigned_factory);

-- Comments for documentation
COMMENT ON COLUMN public.products.factory_name IS 'Name of the factory this product belongs to';
COMMENT ON COLUMN public.master_products.factory_name IS 'Name of the factory this master product belongs to';
COMMENT ON COLUMN public.users.assigned_factory IS 'Factory assigned to this user for product visibility filtering';

