-- Migration: fix_rls_policies_supabase_compatible
-- Created at: 1763755953

-- Drop existing policies that rely on auth.uid() 
DROP POLICY IF EXISTS "fleet_read_own_shipments" ON shipments;
DROP POLICY IF EXISTS "fleet_update_own_shipments" ON shipments;
DROP POLICY IF EXISTS "accountant_read_shipments" ON shipments;
DROP POLICY IF EXISTS "accountant_update_shipments" ON shipments;

-- Create new policies that work better with Supabase
-- Fleet users can read their own shipments and any returned shipments
CREATE POLICY "fleet_read_shipments_v2" ON shipments
    FOR SELECT
    USING (
        -- Allow if user has fleet role
        (SELECT role FROM users WHERE id = auth.uid()) = 'مسؤول الحركة'
        AND (
            -- Allow if it's a returned shipment
            status = 'مرتجعة لمسؤول الحركة'
            OR
            -- Allow if user created it
            created_by = auth.uid()
        )
    );

-- Fleet users can update their own shipments and returned shipments
CREATE POLICY "fleet_update_shipments_v2" ON shipments
    FOR UPDATE
    USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'مسؤول الحركة'
        AND (
            -- Allow if it's a returned shipment
            status = 'مرتجعة لمسؤول الحركة'
            OR
            -- Allow if user created it and it's in editable states
            (created_by = auth.uid() AND status = ANY(ARRAY['من المبيعات', 'طلب تعديل', 'مرتجعة لمسؤول الحركة']))
        )
    )
    WITH CHECK (
        (SELECT role FROM users WHERE id = auth.uid()) = 'مسؤول الحركة'
        AND (
            status = 'مرتجعة لمسؤول الحركة'
            OR
            (created_by = auth.uid() AND status = ANY(ARRAY['من المبيعات', 'طلب تعديل', 'مرتجعة لمسؤول الحركة']))
        )
    );

-- Accountant users can read and update shipments in their workflow
CREATE POLICY "accountant_shipments_access_v2" ON shipments
    FOR ALL
    USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'محاسب'
        AND status = ANY(ARRAY['من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة'])
    )
    WITH CHECK (
        (SELECT role FROM users WHERE id = auth.uid()) = 'محاسب'
        AND status = ANY(ARRAY['من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة'])
    );

-- Admin users have full access
CREATE POLICY "admin_full_access_v2" ON shipments
    FOR ALL
    USING ((SELECT role FROM users WHERE id = auth.uid()) = 'ادمن')
    WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'ادمن');

-- Fleet users can still insert shipments
CREATE POLICY "fleet_insert_shipments_v2" ON shipments
    FOR INSERT
    WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'مسؤول الحركة');;