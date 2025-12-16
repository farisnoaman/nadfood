-- Migration: fix_fleet_update_policy_for_returned_shipments
-- Created at: 1763753348

-- Drop the existing fleet update policy
DROP POLICY IF EXISTS fleet_update_own_shipments ON shipments;

-- Create a new policy that allows fleet managers to update:
-- 1. Shipments they created with certain statuses
-- 2. Any returned shipments (regardless of who created it)
CREATE POLICY fleet_update_own_shipments ON shipments
  FOR UPDATE TO public
  USING (
    get_user_role() = 'مسؤول الحركة' AND (
      -- They can update shipments they created with these statuses
      (created_by = auth.uid() AND status IN ('من المبيعات', 'طلب تعديل', 'مرتجعة لمسؤول الحركة'))
      OR
      -- Or any returned shipment (regardless of who created it)
      status = 'مرتجعة لمسؤول الحركة'
    )
  )
  WITH CHECK (
    get_user_role() = 'مسؤول الحركة' AND (
      -- They can update shipments they created back to من المبيعات
      (created_by = auth.uid() AND status = 'من المبيعات')
      OR
      -- Or any returned shipment to من المبيعات 
      status = 'مرتجعة لمسؤول الحركة'
    )
  );;