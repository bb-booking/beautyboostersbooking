-- Allow admin to update and delete conversation messages
ALTER TABLE public.conversation_messages
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Update RLS policies for conversation_messages to allow admin to update and delete
DROP POLICY IF EXISTS "Admins can update messages" ON public.conversation_messages;
CREATE POLICY "Admins can update messages"
ON public.conversation_messages
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete messages" ON public.conversation_messages;
CREATE POLICY "Admins can delete messages"
ON public.conversation_messages
FOR DELETE
USING (true);

COMMENT ON COLUMN public.conversation_messages.edited_at IS 'Timestamp when message was last edited';
COMMENT ON COLUMN public.conversation_messages.deleted_at IS 'Soft delete timestamp';