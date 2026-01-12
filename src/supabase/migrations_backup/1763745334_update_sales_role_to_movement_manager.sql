-- Migration: update_sales_role_to_movement_manager
-- Created at: 1763745334

-- Step 1: Drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Add new check constraint with updated role value
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('مسؤول الحركة', 'محاسب', 'ادمن'));

-- Step 3: Update existing sales role records
UPDATE users SET role = 'مسؤول الحركة' WHERE role = 'مبيعات';;