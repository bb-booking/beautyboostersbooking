-- Drop the overly permissive INSERT policy on conversation_messages
-- The policy "Admins can insert messages" has WITH CHECK: true which allows anyone to insert
DROP POLICY IF EXISTS "Admins can insert messages" ON public.conversation_messages;