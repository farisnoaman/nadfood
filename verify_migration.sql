
-- Verify payment_status column exists
SELECT 
  table_name, 
  column_name, 
  data_type, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name = 'payment_status';

-- Verify payment_codes table exists
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_name = 'payment_codes';

-- List constraints to ensure valid values
SELECT 
  conname as constraint_name, 
  pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c 
JOIN pg_namespace n ON n.oid = c.connamespace 
WHERE conrelid = 'public.companies'::regclass 
AND conname LIKE '%payment_status%';
