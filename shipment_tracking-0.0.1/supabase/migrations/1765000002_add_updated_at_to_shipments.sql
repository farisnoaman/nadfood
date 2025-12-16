-- Add updated_at column to shipments table
ALTER TABLE shipments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Set initial values for existing records
UPDATE shipments SET updated_at = COALESCE(modified_at, created_at, NOW()) WHERE updated_at IS NULL;

-- Create trigger to auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_shipments_updated_at();