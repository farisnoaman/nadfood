-- Migration: fix_accountant_update_policy_logic
-- Created at: 1763752512

-- Migration: fix_accountant_update_policy_logic
-- Fix the accountant UPDATE policy to properly handle the workflow

-- Drop the existing accountant update policy
DROP POLICY IF EXISTS accountant_update_shipments ON shipments;

-- Create a corrected accountant update policy
-- Accountant can update shipments by:
-- 1. FROM: من المبيعات, مسودة, طلب تعديل, مرسلة للادمن, مرتجعة لمسؤول الحركة
-- 2. TO: مسودة (draft), مرسلة للادمن (sent to admin), مرتجعة لمسؤول الحركة (returned to fleet)
CREATE POLICY accountant_update_shipments ON shipments
    FOR UPDATE TO public
    USING (
        get_user_role() = 'محاسب' 
        AND status IN ('من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة')
    )
    WITH CHECK (
        get_user_role() = 'محاسب' 
        AND (
            -- Allow updating TO these statuses regardless of current status:
            status IN ('مسودة', 'مرسلة للادمن', 'مرتجعة لمسؤول الحركة')
            -- AND the record still satisfies the USING clause conditions
            AND (
                -- If updating to 'مسودة', the current status must be 'من المبيعات'
                (status = 'مسودة' AND current_status IN ('من المبيعات', 'طلب تعديل'))
                OR 
                -- If updating to 'مرسلة للادمن', the current status must be 'من المبيعات'
                (status = 'مرسلة للادمن' AND current_status IN ('من المبيعات', 'مسودة', 'طلب تعديل'))
                OR
                -- If updating to 'مرتجعة لمسؤول الحركة', the current status must be 'من المبيعات'
                (status = 'مرتجعة لمسؤول الحركة' AND current_status IN ('من المبيعات', 'مسودة', 'طلب تعديل', 'مرسلة للادمن'))
            )
        )
    );

-- Actually, let me use a simpler approach with a function to get current status
-- First drop this policy and create a better one
DROP POLICY IF EXISTS accountant_update_shipments ON shipments;

-- Create a simpler, more flexible policy
-- Accountant can update if they have the role and the shipment is in an editable state
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