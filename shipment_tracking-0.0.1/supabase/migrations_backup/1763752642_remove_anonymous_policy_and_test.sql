-- Migration: remove_anonymous_policy_and_test
-- Created at: 1763752642

-- Migration: remove_anonymous_policy_and_test
-- Remove the generic anonymous policy that might be interfering

-- Drop the generic anonymous policy
DROP POLICY IF EXISTS "Allow anon and service_role to update shipments" ON shipments;

-- Let's also verify the current policies are correct
-- The accountant policy should allow:
-- - Update FROM: من المبيعات, مسودة, طلب تعديل, مرسلة للادمن, مرتجعة لمسؤول الحركة
-- - Update TO: مرسلة للادمن, مسودة, مرتجعة لمسؤول الحركة

-- Test policy (remove and recreate to make sure it's clean)
DROP POLICY IF EXISTS accountant_update_shipments ON shipments;

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