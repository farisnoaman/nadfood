-- Migration: cleanup_debug_functions
-- Remove all debug and test functions from production database
-- Created at: 1765000000

-- Drop debug functions
DROP FUNCTION IF EXISTS debug_current_user();
DROP FUNCTION IF EXISTS debug_user_info();
DROP FUNCTION IF EXISTS test_shipment_update();
DROP FUNCTION IF EXISTS get_test_data();

-- Drop any test data if it exists
-- Note: This assumes test data was inserted with identifiable markers
-- If test data exists, add specific cleanup queries here

-- Log the cleanup
DO $$
BEGIN
    RAISE NOTICE 'Debug and test functions have been removed from the database';
END $$;