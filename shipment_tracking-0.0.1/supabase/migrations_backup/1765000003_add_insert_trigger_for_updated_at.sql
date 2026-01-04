-- Ensure updated_at is set on new shipments (inserts)
-- The BEFORE UPDATE trigger already handles updates
-- This AFTER INSERT ensures inserts also set updated_at

CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- For inserts, updated_at is already defaulted to NOW(), but ensure it's set
    IF TG_OP = 'INSERT' THEN
        -- Already handled by default, but can override if needed
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at = NOW();
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_shipments_updated_at ON shipments;

-- Create new trigger for both INSERT and UPDATE
CREATE TRIGGER trigger_update_shipments_updated_at
    BEFORE INSERT OR UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_shipments_updated_at();