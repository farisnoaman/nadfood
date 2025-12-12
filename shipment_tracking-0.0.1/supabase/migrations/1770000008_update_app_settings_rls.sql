-- Update app_settings RLS policy to allow all users to read settings
-- This allows the app to fetch global settings on initialization

-- Drop the existing admin-only SELECT policy
DROP POLICY IF EXISTS "Allow admins to read app settings" ON public.app_settings;

-- Create new policy allowing all users to read settings
CREATE POLICY "Allow all users to read app settings" ON public.app_settings
    FOR SELECT USING (true);</content>
<parameter name="filePath">shipment_tracking-0.0.1/supabase/migrations/1770000008_update_app_settings_rls.sql