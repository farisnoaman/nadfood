-- Migration: update_sales_role_step_by_step
-- Created at: 1763745346

-- Step 1: Drop the existing constraint that prevents the update
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Update the data from old role to new role
UPDATE users SET role = 'مسؤول الحركة' WHERE role = 'مبيعات';

-- Step 3: Add the updated constraint with new role values
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('مسؤول الحركة', 'محاسب', 'ادمن'));;