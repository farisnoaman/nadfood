-- Migration: fix_fleet_read_policy_for_returned_shipments
-- Created at: 1763753338

-- Drop the existing fleet read policy
DROP POLICY IF EXISTS fleet_read_own_shipments ON shipments;

-- Create a new policy that allows fleet managers to see:
-- 1. Shipments they created themselves
-- 2. Any shipments with "مرتجعة لمسؤول الحركة" status (returned to them)
CREATE POLICY fleet_read_own_shipments ON shipments
  FOR SELECT TO public
  USING (
    get_user_role() = 'مسؤول الحركة' AND (
      -- They can see shipments they created
      created_by = auth.uid() 
      OR 
      -- Or any shipment returned to them (regardless of who created it)
      status = 'مرتجعة لمسؤول الحركة'
    )
  );;