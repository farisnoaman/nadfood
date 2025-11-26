-- Update user roles from 'sales' to 'fleet' and 'admin' to 'manager'
UPDATE public.users SET role = 'fleet' WHERE role = 'sales';
UPDATE public.users SET role = 'manager' WHERE role = 'admin';

-- Verify the updates
SELECT username, role, is_active FROM public.users ORDER BY role, username;
