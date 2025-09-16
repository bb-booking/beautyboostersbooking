-- Fix remaining security vulnerabilities for notifications and job communications

-- 1. Fix notifications table - users should only see their own notifications  
DROP POLICY IF EXISTS "Allow all operations on notifications" ON public.notifications;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (recipient_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Admins and system can create notifications
CREATE POLICY "System and admins can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() IS NULL);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (recipient_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (recipient_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete notifications
CREATE POLICY "Admins can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix job_communications table - only job participants should access communications
DROP POLICY IF EXISTS "Allow all operations on job_communications" ON public.job_communications;

-- Only admins and job participants can view communications
CREATE POLICY "Job participants can view communications" 
ON public.job_communications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create/manage job communications for now
CREATE POLICY "Admins can manage job communications" 
ON public.job_communications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));