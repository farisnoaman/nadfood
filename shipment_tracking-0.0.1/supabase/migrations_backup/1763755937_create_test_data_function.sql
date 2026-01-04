-- Migration: create_test_data_function
-- Created at: 1763755937

-- Create a temporary function to test data access without RLS
CREATE OR REPLACE FUNCTION test_basic_data_access()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Test basic table access
  SELECT json_build_object(
    'users_count', (SELECT COUNT(*) FROM users),
    'products_count', (SELECT COUNT(*) FROM products),
    'drivers_count', (SELECT COUNT(*) FROM drivers),
    'regions_count', (SELECT COUNT(*) FROM regions),
    'shipments_count', (SELECT COUNT(*) FROM shipments),
    'returned_shipments_count', (SELECT COUNT(*) FROM shipments WHERE status = 'مرتجعة لمسؤول الحركة'),
    'auth_uid', auth.uid(),
    'current_user_role', get_user_role()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;