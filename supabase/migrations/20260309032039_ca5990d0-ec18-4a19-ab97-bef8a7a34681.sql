
-- Drop the existing insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a new policy that allows authenticated users to insert notifications for any user
-- This is needed for nudges, partner requests, etc.
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);
