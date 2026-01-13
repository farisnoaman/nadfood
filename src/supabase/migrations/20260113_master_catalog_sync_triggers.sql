-- ============================================================
-- MASTER CATALOG SYNC TRIGGERS
-- Automatically sync master catalog changes to company records
-- ============================================================

-- ============================================
-- FUNCTION: Sync Master Product Updates
-- ============================================
CREATE OR REPLACE FUNCTION sync_master_product_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- When a master product is updated, propagate name changes to linked company products
    -- Note: Weight is also synced, but prices are company-specific
    
    IF TG_OP = 'UPDATE' THEN
        -- Only sync if the master record changes
        IF OLD.name IS DISTINCT FROM NEW.name OR OLD.weight_kg IS DISTINCT FROM NEW.weight_kg THEN
            UPDATE public.products
            SET 
                name = NEW.name,
                weight_kg = NEW.weight_kg
            WHERE master_product_id = NEW.id;
            
            RAISE NOTICE 'Synced master product % to % company products', NEW.id, 
                (SELECT COUNT(*) FROM public.products WHERE master_product_id = NEW.id);
        END IF;
        
        -- If master product is deactivated, also deactivate linked products
        IF OLD.is_active = true AND NEW.is_active = false THEN
            UPDATE public.products
            SET is_active = false
            WHERE master_product_id = NEW.id;
            
            RAISE NOTICE 'Deactivated company products linked to master product %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-sync Master Product Updates
-- ============================================
DROP TRIGGER IF EXISTS trigger_sync_master_products ON public.master_products;
CREATE TRIGGER trigger_sync_master_products
    AFTER UPDATE ON public.master_products
    FOR EACH ROW
    EXECUTE FUNCTION sync_master_product_updates();

-- ============================================
-- FUNCTION: Sync Master Region Updates
-- ============================================
CREATE OR REPLACE FUNCTION sync_master_region_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- When a master region is updated, propagate name changes to linked company regions
    -- Note: Pricing/fees are company-specific and NOT synced
    
    IF TG_OP = 'UPDATE' THEN
        -- Only sync if the name changes
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            UPDATE public.regions
            SET name = NEW.name
            WHERE master_region_id = NEW.id;
            
            RAISE NOTICE 'Synced master region % to % company regions', NEW.id,
                (SELECT COUNT(*) FROM public.regions WHERE master_region_id = NEW.id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-sync Master Region Updates
-- ============================================
DROP TRIGGER IF EXISTS trigger_sync_master_regions ON public.master_regions;
CREATE TRIGGER trigger_sync_master_regions
    AFTER UPDATE ON public.master_regions
    FOR EACH ROW
    EXECUTE FUNCTION sync_master_region_updates();

-- ============================================
-- FUNCTION: Prevent Deletion of Linked Master Items
-- ============================================
CREATE OR REPLACE FUNCTION prevent_master_product_deletion()
RETURNS TRIGGER AS $$
DECLARE
    linked_count INTEGER;
BEGIN
    -- Check if any company products are linked to this master product
    SELECT COUNT(*) INTO linked_count
    FROM public.products
    WHERE master_product_id = OLD.id;
    
    IF linked_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete master product "%" because it is linked to % company product(s). Deactivate it instead.', 
            OLD.name, linked_count;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_master_product_deletion ON public.master_products;
CREATE TRIGGER trigger_prevent_master_product_deletion
    BEFORE DELETE ON public.master_products
    FOR EACH ROW
    EXECUTE FUNCTION prevent_master_product_deletion();

-- ============================================
-- FUNCTION: Prevent Deletion of Linked Master Regions
-- ============================================
CREATE OR REPLACE FUNCTION prevent_master_region_deletion()
RETURNS TRIGGER AS $$
DECLARE
    linked_count INTEGER;
BEGIN
    -- Check if any company regions are linked to this master region
    SELECT COUNT(*) INTO linked_count
    FROM public.regions
    WHERE master_region_id = OLD.id;
    
    IF linked_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete master region "%" because it is linked to % company region(s). Deactivate it instead.', 
            OLD.name, linked_count;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_master_region_deletion ON public.master_regions;
CREATE TRIGGER trigger_prevent_master_region_deletion
    BEFORE DELETE ON public.master_regions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_master_region_deletion();

-- ============================================
-- VERIFICATION: Test the triggers exist
-- ============================================
-- SELECT tgname, tgrelid::regclass, tgenabled 
-- FROM pg_trigger 
-- WHERE tgname LIKE '%master%';
