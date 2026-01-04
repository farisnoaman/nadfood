-- Migration: add_installment_type_fields
-- Created at: 1770000002

-- Add installment_type and original_amount fields to installments table
-- for debt collection functionality

ALTER TABLE installments
ADD COLUMN IF NOT EXISTS installment_type TEXT DEFAULT 'regular' CHECK (installment_type IN ('regular', 'debt_collection'));

ALTER TABLE installments
ADD COLUMN IF NOT EXISTS original_amount NUMERIC;

-- Add comment for documentation
COMMENT ON COLUMN installments.installment_type IS 'Type of installment: regular or debt_collection';
COMMENT ON COLUMN installments.original_amount IS 'Original amount for debt collection (negative values converted to positive)';