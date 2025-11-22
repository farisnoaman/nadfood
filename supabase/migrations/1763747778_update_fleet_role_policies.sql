-- Migration: update_fleet_role_policies
-- Created at: 1763747778

-- Update RLS policies for fleet role (مسؤول الحركة) across all related tables
-- This migration ensures fleet users can properly insert, update, and view shipment-related data

-- ============================================
-- SHIPMENT_PRODUCTS TABLE POLICIES
-- ============================================

-- Drop old sales policy
DROP POLICY IF EXISTS "sales_all_shipment_products" ON shipment_products;

-- Create new fleet policy for all operations on shipment_products
CREATE POLICY "fleet_all_shipment_products"
ON shipment_products
FOR ALL
TO public
USING (get_user_role() = 'مسؤول الحركة')
WITH CHECK (get_user_role() = 'مسؤول الحركة');

-- Add comment
COMMENT ON POLICY "fleet_all_shipment_products" ON shipment_products IS 
'Allows fleet users (مسؤول الحركة) to insert, update, delete, and view shipment products';;