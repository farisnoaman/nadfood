-- Migration: fix_accountant_update_policy_with_check
-- Created at: 1763752043

-- Drop existing accountant update policy
DROP POLICY IF EXISTS accountant_update_shipments_fixed ON shipments;

-- Create new policy with proper WITH CHECK clause
-- USING clause: checks current status (what accountant can see/update)
-- WITH CHECK clause: checks new status (what accountant can set)
CREATE POLICY accountant_update_shipments_fixed ON shipments
  FOR UPDATE
  TO public
  USING (
    get_user_role() = 'محاسب'
    AND status IN ('من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن')
  )
  WITH CHECK (
    get_user_role() = 'محاسب'
    AND status IN ('مسودة', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة')
  );
;