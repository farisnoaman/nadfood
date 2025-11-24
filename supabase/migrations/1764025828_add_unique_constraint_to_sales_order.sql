-- Migration: add_unique_constraint_to_sales_order
-- Created at: 1764025828

-- Add unique constraint to sales_order column (excluding null values)
ALTER TABLE shipments ADD CONSTRAINT shipments_sales_order_unique 
UNIQUE (sales_order) DEFERRABLE INITIALLY DEFERRED;

-- Note: DEFERRABLE INITIALLY DEFERRED allows the constraint to be checked at the end of the transaction
-- This prevents issues during bulk operations or when multiple shipments are being processed
