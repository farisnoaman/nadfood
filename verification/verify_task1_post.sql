SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND column_name IN ('subscription_plan', 'usage_limits', 'current_usage', 'features', 'billing_cycle', 'subscription_status');
-- Expected: 6 rows
