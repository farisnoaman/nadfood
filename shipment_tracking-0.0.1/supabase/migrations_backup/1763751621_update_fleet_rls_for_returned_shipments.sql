-- Migration: update_fleet_rls_for_returned_shipments
-- Created at: 1763751621

-- Drop existing policy
DROP POLICY IF EXISTS fleet_update_own_shipments ON shipments;

-- Create updated policy that includes the new RETURNED_TO_FLEET status
CREATE POLICY fleet_update_own_shipments ON shipments
  FOR UPDATE
  TO public
  USING (
    get_user_role() = 'مسؤول الحركة' 
    AND created_by = auth.uid()
    AND status IN ('من المبيعات', 'طلب تعديل', 'مرتجعة لمسؤول الحركة')
  );

-- Update accountant read policy to include returned shipments
DROP POLICY IF EXISTS accountant_read_shipments ON shipments;

CREATE POLICY accountant_read_shipments ON shipments
  FOR SELECT
  TO public
  USING (
    get_user_role() = 'محاسب'
    AND status IN ('من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة')
  );
;