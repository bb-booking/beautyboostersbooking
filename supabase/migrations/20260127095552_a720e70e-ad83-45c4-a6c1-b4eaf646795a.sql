-- Drop the problematic policy that references auth.users directly
DROP POLICY IF EXISTS "Users can insert messages" ON public.conversation_messages;

-- Create a new policy that uses auth.email() instead of querying auth.users
CREATE POLICY "Users can insert messages"
ON public.conversation_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = conversation_messages.conversation_id
    AND (
      c.email = auth.email()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR auth.uid() IS NULL
    )
  )
);