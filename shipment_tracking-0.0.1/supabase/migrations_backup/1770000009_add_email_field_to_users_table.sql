-- Migration: add_email_field_to_users_table
-- Created at: 1770000009
-- Add email field to users table for login dropdown functionality

-- Add email column to users table
ALTER TABLE users ADD COLUMN email TEXT;

-- Update existing users with emails from auth.users
UPDATE users
SET email = auth_users.email
FROM auth.users as auth_users
WHERE users.id = auth_users.id;

-- Add index on email for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add comment
COMMENT ON COLUMN users.email IS 'User email address for authentication and login dropdown';