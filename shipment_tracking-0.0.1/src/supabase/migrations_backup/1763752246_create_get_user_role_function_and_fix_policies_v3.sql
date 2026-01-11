-- Migration: create_get_user_role_function_and_fix_policies_v3
-- Created at: 1763752246

-- Migration: create_get_user_role_function_and_fix_policies_v3
-- This migration creates the missing get_user_role function and fixes RLS policies

-- ============================================
-- CREATE GET_USER_ROLE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- If no user is authenticated, return empty string
    IF current_user_id IS NULL THEN
        RETURN '';
    END IF;
    
    -- Get the user's role from their profile or user metadata
    -- First try to get from user metadata
    SELECT COALESCE(
        (auth.jwt() ->> 'user_role'),
        (raw_user_meta_data ->> 'role'),
        ''
    ) INTO user_role
    FROM auth.users 
    WHERE id = current_user_id;
    
    -- If not found in metadata, check if user exists in a profiles table
    IF user_role IS NULL OR user_role = '' THEN
        SELECT role INTO user_role 
        FROM profiles 
        WHERE id = current_user_id;
    END IF;
    
    RETURN COALESCE(user_role, '');
END;
$$;

-- ============================================
-- ENSURE PROFILES TABLE EXISTS AND HAS DATA
-- ============================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'مسؤول الحركة',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create policy for users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'ادمن'
        )
    );

-- ============================================
-- FIX SHIPMENTS RLS POLICIES
-- ============================================

-- Drop all existing shipments policies to recreate them cleanly
DROP POLICY IF EXISTS "accountant_update_shipments_fixed" ON shipments;
DROP POLICY IF EXISTS "accountant_read_shipments" ON shipments;
DROP POLICY IF EXISTS "fleet_update_own_shipments" ON shipments;
DROP POLICY IF EXISTS "admin_full_access_shipments" ON shipments;
DROP POLICY IF EXISTS "accountant_update_shipments" ON shipments;
DROP POLICY IF EXISTS "fleet_read_own_shipments" ON shipments;
DROP POLICY IF EXISTS "fleet_insert_shipments" ON shipments;

-- Create admin policy with proper roles
CREATE POLICY admin_full_access_shipments ON shipments
    FOR ALL TO public
    USING (get_user_role() = 'ادمن')
    WITH CHECK (get_user_role() = 'ادمن');

-- Create accountant policies
-- Accountant can read shipments with specific statuses
CREATE POLICY accountant_read_shipments ON shipments
    FOR SELECT TO public
    USING (
        get_user_role() = 'محاسب' 
        AND status IN ('من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة')
    );

-- Accountant can update shipments (change status from sales to draft or sent to admin or return to fleet)
CREATE POLICY accountant_update_shipments ON shipments
    FOR UPDATE TO public
    USING (
        get_user_role() = 'محاسب' 
        AND status IN ('من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة')
    )
    WITH CHECK (
        get_user_role() = 'محاسب' 
        AND status IN ('مرسلة للادمن', 'مسودة', 'مرتجعة لمسؤول الحركة')
    );

-- Create fleet policy for shipments they created
CREATE POLICY fleet_update_own_shipments ON shipments
    FOR UPDATE TO public
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

-- Allow fleet users to read their own shipments
CREATE POLICY fleet_read_own_shipments ON shipments
    FOR SELECT TO public
    USING (
        get_user_role() = 'مسؤول الحركة' 
        AND created_by = auth.uid()
    );

-- Allow fleet users to insert new shipments
CREATE POLICY fleet_insert_shipments ON shipments
    FOR INSERT TO public
    WITH CHECK (
        get_user_role() = 'مسؤول الحركة' 
        AND created_by = auth.uid()
    );

-- ============================================
-- ADD HELPER FUNCTIONS FOR DEBUGGING
-- ============================================

-- Function to check current user's role (for debugging)
CREATE OR REPLACE FUNCTION debug_current_user()
RETURNS TABLE(user_id UUID, email TEXT, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid(),
        (auth.users()).email,
        get_user_role();
END;
$$;

-- Function to test policy (for debugging)
CREATE OR REPLACE FUNCTION test_shipment_policy(shipment_id TEXT)
RETURNS TABLE(user_id UUID, can_select BOOLEAN, can_update BOOLEAN, user_role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid UUID;
    user_role_val TEXT;
    can_select_val BOOLEAN;
    can_update_val BOOLEAN;
BEGIN
    user_uuid := auth.uid();
    user_role_val := get_user_role();
    
    -- Test SELECT policy
    SELECT EXISTS(
        SELECT 1 FROM shipments 
        WHERE id = shipment_id 
        AND (
            get_user_role() = 'ادمن'
            OR (get_user_role() = 'محاسب' AND status IN ('من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة'))
            OR (get_user_role() = 'مسؤول الحركة' AND created_by = auth.uid())
        )
    ) INTO can_select_val;
    
    -- Test UPDATE policy  
    SELECT EXISTS(
        SELECT 1 FROM shipments 
        WHERE id = shipment_id 
        AND (
            get_user_role() = 'ادمن'
            OR (get_user_role() = 'محاسب' AND status IN ('من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة'))
            OR (get_user_role() = 'مسؤول الحركة' AND created_by = auth.uid())
        )
    ) INTO can_update_val;
    
    RETURN QUERY SELECT user_uuid, can_select_val, can_update_val, user_role_val;
END;
$$;;