-- Migration: add_returned_to_fleet_status_to_constraint
-- Created at: 1763752994

-- Drop the existing check constraint
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_status_check;

-- Add the updated check constraint with all allowed statuses including "مرتجعة لمسؤول الحركة"
ALTER TABLE shipments ADD CONSTRAINT shipments_status_check 
CHECK (status = ANY (ARRAY[
  'من المبيعات'::text,
  'مسودة'::text, 
  'مرسلة للادمن'::text,
  'طلب تعديل'::text,
  'نهائي'::text,
  'نهائي معدل'::text,
  'مرتجعة لمسؤول الحركة'::text
]));;