-- Migration: cleanup_and_fix_all_shipments_policies
-- Created at: 1763752065

-- Drop duplicate/old accountant policy that uses wrong function
DROP POLICY IF EXISTS "Accountants can update shipments" ON shipments;
DROP POLICY IF EXISTS "Accountants can read shipments" ON shipments;

-- Fix fleet update policy - add WITH CHECK clause
DROP POLICY IF EXISTS fleet_update_own_shipments ON shipments;

CREATE POLICY fleet_update_own_shipments ON shipments
  FOR UPDATE
  TO public
  USING (
    get_user_role() = 'مسؤول الحركة' 
    AND created_by = auth.uid()
    AND status IN ('من المبيعات', 'طلب تعديل', 'مرتجعة لمسؤول الحركة')
  )
  WITH CHECK (
    get_user_role() = 'مسؤول الحركة'
    AND created_by = auth.uid()
    AND status = 'من المبيعات'
  );

-- Ensure admin has proper WITH CHECK for ALL operations
DROP POLICY IF EXISTS admin_full_access_shipments ON shipments;

CREATE POLICY admin_full_access_shipments ON shipments
  FOR ALL
  TO public
  USING (get_user_role() = 'ادمن')
  WITH CHECK (get_user_role() = 'ادمن');
;