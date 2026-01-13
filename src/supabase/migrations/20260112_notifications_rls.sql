-- Add INSERT policy for notifications table
-- Allows any authenticated user to create notifications
-- This is needed because fleet users create notifications when submitting shipments

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

-- Create INSERT policy allowing all authenticated users to insert notifications
CREATE POLICY "Users can insert notifications" ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure we have an UPDATE policy for marking notifications as read
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
