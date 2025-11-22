-- Migration: update_shipments_policies_for_fleet_role
-- Created at: 1763747115

-- Drop old sales policies that use outdated role name
DROP POLICY IF EXISTS "sales_insert_shipments" ON shipments;
DROP POLICY IF EXISTS "sales_read_own_shipments" ON shipments;
DROP POLICY IF EXISTS "sales_update_own_shipments" ON shipments;

-- Create new fleet/sales policies with updated role name 'مسؤول الحركة'
CREATE POLICY "fleet_insert_shipments" ON shipments
    FOR INSERT
    TO public
    WITH CHECK (
        get_user_role() = 'مسؤول الحركة' 
        AND created_by = auth.uid()
    );

CREATE POLICY "fleet_read_own_shipments" ON shipments
    FOR SELECT
    TO public
    USING (
        get_user_role() = 'مسؤول الحركة' 
        AND created_by = auth.uid()
    );

CREATE POLICY "fleet_update_own_shipments" ON shipments
    FOR UPDATE
    TO public
    USING (
        get_user_role() = 'مسؤول الحركة' 
        AND created_by = auth.uid() 
        AND status IN ('من المبيعات', 'طلب تعديل')
    );;