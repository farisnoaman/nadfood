-- Function to check limits BEFORE insertion
CREATE OR REPLACE FUNCTION public.check_subscription_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_limit_key TEXT;
    v_count_key TEXT;
    v_max_limit INT;
    v_current_count INT;
    v_plan_status TEXT;
BEGIN
    v_company_id := NEW.company_id;
    
    -- Determine which entity we are checking based on the table name
    IF TG_TABLE_NAME = 'drivers' THEN
        v_limit_key := 'maxDrivers';
        v_count_key := 'drivers';
    ELSIF TG_TABLE_NAME = 'regions' THEN
        v_limit_key := 'maxRegions';
        v_count_key := 'regions';
    ELSIF TG_TABLE_NAME = 'products' THEN
        v_limit_key := 'maxProducts';
        v_count_key := 'products';
    ELSE
        RETURN NEW; -- Should not happen if trigger is bound correctly
    END IF;

    -- Get company subscription details
    SELECT 
        (usage_limits->>v_limit_key)::INT,
        (current_usage->>v_count_key)::INT,
        subscription_status
    INTO 
        v_max_limit,
        v_current_count,
        v_plan_status
    FROM public.companies 
    WHERE id = v_company_id;

    -- Check status
    IF v_plan_status IN ('suspended', 'cancelled', 'expired') THEN
        RAISE EXCEPTION 'Subscription is %', v_plan_status;
    END IF;

    -- Check limits (if limit is defined)
    IF v_max_limit IS NOT NULL AND v_current_count >= v_max_limit THEN
        RAISE EXCEPTION 'Limit reached for %: % / %', v_count_key, v_current_count, v_max_limit;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update usage counts AFTER insert/delete
CREATE OR REPLACE FUNCTION public.update_company_usage_counts()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_count_key TEXT;
    v_new_count INT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_company_id := NEW.company_id;
    ELSE
        v_company_id := OLD.company_id;
    END IF;

    -- Determine key
    IF TG_TABLE_NAME = 'drivers' THEN
        v_count_key := 'drivers';
    ELSIF TG_TABLE_NAME = 'regions' THEN
        v_count_key := 'regions';
    ELSIF TG_TABLE_NAME = 'products' THEN
        v_count_key := 'products';
    ELSE
        RETURN NULL;
    END IF;

    -- Calculate new count (safer than incremental for consistency)
    EXECUTE format('SELECT count(*) FROM public.%I WHERE company_id = $1', TG_TABLE_NAME)
    INTO v_new_count
    USING v_company_id;

    -- Update company record
    UPDATE public.companies
    SET current_usage = jsonb_set(
        COALESCE(current_usage, '{}'::jsonb),
        ARRAY[v_count_key],
        to_jsonb(v_new_count)
    )
    WHERE id = v_company_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Triggers for Drivers
DROP TRIGGER IF EXISTS check_limit_drivers ON public.drivers;
CREATE TRIGGER check_limit_drivers
BEFORE INSERT ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.check_subscription_limits();

DROP TRIGGER IF EXISTS update_usage_drivers ON public.drivers;
CREATE TRIGGER update_usage_drivers
AFTER INSERT OR DELETE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.update_company_usage_counts();

-- Create Triggers for Regions
DROP TRIGGER IF EXISTS check_limit_regions ON public.regions;
CREATE TRIGGER check_limit_regions
BEFORE INSERT ON public.regions
FOR EACH ROW EXECUTE FUNCTION public.check_subscription_limits();

DROP TRIGGER IF EXISTS update_usage_regions ON public.regions;
CREATE TRIGGER update_usage_regions
AFTER INSERT OR DELETE ON public.regions
FOR EACH ROW EXECUTE FUNCTION public.update_company_usage_counts();

-- Create Triggers for Products
DROP TRIGGER IF EXISTS check_limit_products ON public.products;
CREATE TRIGGER check_limit_products
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.check_subscription_limits();

DROP TRIGGER IF EXISTS update_usage_products ON public.products;
CREATE TRIGGER update_usage_products
AFTER INSERT OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_company_usage_counts();
