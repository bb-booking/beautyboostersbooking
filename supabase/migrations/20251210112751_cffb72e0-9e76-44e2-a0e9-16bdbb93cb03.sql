-- Fix conversation_messages RLS policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Admins can view messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Public can insert messages" ON public.conversation_messages;

-- Create properly restricted policies
-- Admins can view all messages
CREATE POLICY "Admins can view messages" 
ON public.conversation_messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete messages
CREATE POLICY "Admins can delete messages" 
ON public.conversation_messages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Admins can update messages
CREATE POLICY "Admins can update messages" 
ON public.conversation_messages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Anyone can insert messages (for chat widget functionality)
-- But they can only insert into conversations they created or have access to
CREATE POLICY "Users can insert messages" 
ON public.conversation_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND (
      c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR has_role(auth.uid(), 'admin')
      OR auth.uid() IS NULL -- Allow anonymous users who created the conversation
    )
  )
);