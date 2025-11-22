-- Migration: cleanup_generic_policies
-- Created at: 1763752662

-- Migration: cleanup_generic_policies
-- Remove generic policies that might interfere with role-based access

-- Remove generic read policy that allows all authenticated users
DROP POLICY IF EXISTS "Allow all authenticated users to read shipments" ON shipments;

-- Remove generic insert policy
DROP POLICY IF EXISTS "Allow anon and service_role to insert shipments" ON shipments;

-- Remove generic delete policy
DROP POLICY IF EXISTS "Allow anon and service_role to delete shipments" ON shipments;

-- Make sure we have proper role-based policies
-- Ensure fleet can INSERT new shipments
DROP POLICY IF EXISTS fleet_insert_shipments ON shipments;

CREATE POLICY fleet_insert_shipments ON shipments
    FOR INSERT TO public
    WITH CHECK (
        get_user_role() = 'مسؤول الحركة' 
        AND created_by = auth.uid()
    );

-- Ensure proper admin access for all operations
DROP POLICY IF EXISTS admin_full_access_shipments ON shipments;

CREATE POLICY admin_full_access_shipments ON shipments
    FOR ALL TO public
    USING (get_user_role() = 'ادمن')
    WITH CHECK (get_user_role() = 'ادمن');;