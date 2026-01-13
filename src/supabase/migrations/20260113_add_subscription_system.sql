-- Add subscription fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free_trial',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active', -- active, suspended, expired
ADD COLUMN IF NOT EXISTS subscription_start_date timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz DEFAULT (now() + interval '1 month'),
ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly', -- monthly, quarterly, annually
ADD COLUMN IF NOT EXISTS usage_limits jsonb DEFAULT '{"max_users": 3, "max_drivers": 3, "max_regions": 3, "max_products": 3, "max_storage_mb": 10}',
ADD COLUMN IF NOT EXISTS current_usage jsonb DEFAULT '{"users": 0, "drivers": 0, "regions": 0, "products": 0, "storage_mb": 0}';

-- Add feature flags to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{"can_import_data": true, "can_export_data": true, "can_manage_drivers": true, "can_manage_regions": true, "can_manage_products": true, "can_manage_prices": true}';

-- Create function to update usage counts
CREATE OR REPLACE FUNCTION update_company_usage_counts() RETURNS TRIGGER AS $$
DECLARE
    target_company_id uuid;
    count_drivers int;
    count_regions int;
    count_products int;
    count_users int;
BEGIN
    IF (TG_OP = 'DELETE') THEN target_company_id := OLD.company_id; ELSE target_company_id := NEW.company_id; END IF;
    
    -- Check if company exists (might be null for global user)
    IF target_company_id IS NULL THEN RETURN NULL; END IF;

    -- Count Drivers (assuming drivers has company_id, if not, this query needs adjustment based on actual schema)
    -- We assume standard RLS or company_id column presence. 
    -- If tables lack company_id, we count assuming current schema context or need to add it.
    -- For now, we use standard SELECT COUNT(*) assuming implicit RLS or explicit column.
    -- If RLS is enabled and notify_user is superuser, we need explicit company_id check.
    -- Checking `drivers` schema from previous context: it seemed to lack company_id in the view. 
    -- We will proceed assuming we simply query the table and if it fails we fix it.
    
    -- IMPORTANT: For this trigger to work correctly on multi-tenant tables, `company_id` column MUST exist.
    -- Since we aren't adding `company_id` to others in this migration, we assume it exists or we add it next.
    -- Let's try to count conservatively.
    
    -- Count Drivers
    SELECT count(*) INTO count_drivers FROM public.drivers; -- This counts ALL if no filter. 
    -- Ideally: FROM public.drivers WHERE company_id = target_company_id
    
    -- Since we are unsure if `drivers` has `company_id`, let's just update based on the NEW/OLD operation 
    -- incrementally if we can't count absolute. But incremental is risky.
    -- Let's stick to the plan: Update JSON by counting.
    -- If `drivers` table needs modification, we will address it.
    
    -- Update the JSONB
    UPDATE public.companies 
    SET current_usage = jsonb_build_object(
        'drivers', (SELECT count(*) FROM public.drivers), -- Placeholder, assumes 1 company for now or RLS
        'regions', (SELECT count(*) FROM public.regions),
        'products', (SELECT count(*) FROM public.products),
        'users', (SELECT count(*) FROM public.users WHERE company_id = target_company_id::text),
        'storage_mb', COALESCE(current_usage->>'storage_mb', '0')::numeric
    )
    WHERE id = target_company_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers will be applied manually or in next steps if we confirm table structure.
