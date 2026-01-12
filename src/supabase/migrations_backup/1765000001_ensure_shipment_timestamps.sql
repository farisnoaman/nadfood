-- Migration: ensure_shipment_timestamps
-- Ensure all shipments have valid entry_timestamp for proper sorting
-- Created at: 1765000001

-- Update any shipments that don't have entry_timestamp set
-- Use created_at as fallback since that's when the shipment was actually created
UPDATE shipments
SET entry_timestamp = created_at
WHERE entry_timestamp IS NULL OR entry_timestamp = '';

-- Add a check constraint to ensure future shipments always have entry_timestamp
-- Note: This might fail if there are existing NULL values, so we update first
ALTER TABLE shipments
ADD CONSTRAINT shipments_entry_timestamp_not_null
CHECK (entry_timestamp IS NOT NULL);

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Shipment timestamps migration completed. All shipments now have valid entry_timestamp values.';
END $$;