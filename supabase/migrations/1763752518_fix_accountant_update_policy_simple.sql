-- Migration: fix_accountant_update_policy_simple
-- Created at: 1763752518

-- Migration: fix_accountant_update_policy_simple
-- Fix the accountant UPDATE policy with correct logic

-- Drop the existing accountant update policy
DROP POLICY IF EXISTS accountant_update_shipments ON shipments;

-- Create a corrected accountant update policy
-- The accountant should be able to update from sales to any of the following states:
-- - مرسلة للادمن (sent to admin) 
-- - مسودة (draft)
-- - مرتجعة لمسؤول الحركة (returned to fleet)
CREATE POLICY accountant_update_shipments ON shipments
    FOR UPDATE TO public
    USING (
        get_user_role() = 'محاسب' 
        AND status IN ('من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة')
    )
    WITH CHECK (
        get_user_role() = 'محاسب' 
        AND status IN ('مرسلة للادمن', 'مسودة', 'مرتجعة لمسؤول الحركة')
    );;