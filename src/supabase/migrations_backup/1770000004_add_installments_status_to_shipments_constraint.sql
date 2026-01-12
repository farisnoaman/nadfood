-- Migration: add_installments_status_to_shipments_constraint
-- Created at: 1770000004
-- Add 'تسديد دين' (INSTALLMENTS) status to the shipments status check constraint

-- First, check what status values exist in the shipments table
-- Run this query first to see what statuses are currently in use:
-- SELECT DISTINCT status, COUNT(*) as count FROM shipments GROUP BY status ORDER BY status;

-- Drop the existing check constraint
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_status_check;

-- Add the updated check constraint with INSTALLMENTS status included
-- Note: This will fail if there are existing rows with invalid status values
ALTER TABLE shipments ADD CONSTRAINT shipments_status_check
CHECK (status = ANY (ARRAY[
  'من المبيعات'::text,
  'مسودة'::text,
  'مرسلة للادمن'::text,
  'طلب تعديل'::text,
  'نهائي'::text,
  'نهائي معدل'::text,
  'مرتجعة لمسؤول الحركة'::text,
  'تسديد دين'::text
]));