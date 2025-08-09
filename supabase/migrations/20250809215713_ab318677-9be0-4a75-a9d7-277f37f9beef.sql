-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMPTZ,
  unread_admin_count INTEGER NOT NULL DEFAULT 0,
  unread_user_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY IF NOT EXISTS "Public can create conversations"
ON public.conversations
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admins can view conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "Admins can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (true);

-- Conversation messages table
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sender TEXT NOT NULL, -- 'user' | 'admin'
  message TEXT,
  email TEXT,
  read_at TIMESTAMPTZ
);

-- Enable RLS for conversation_messages
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversation_messages
CREATE POLICY IF NOT EXISTS "Public can insert messages"
ON public.conversation_messages
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admins can view messages"
ON public.conversation_messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "Admins can insert messages"
ON public.conversation_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admins can update messages"
ON public.conversation_messages
FOR UPDATE
TO authenticated
USING (true);

-- Trigger to update conversation stats on new message
CREATE OR REPLACE FUNCTION public.handle_new_conversation_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      unread_admin_count = CASE WHEN NEW.sender = 'user' THEN unread_admin_count + 1 ELSE unread_admin_count END,
      unread_user_count = CASE WHEN NEW.sender = 'admin' THEN unread_user_count + 1 ELSE unread_user_count END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_conversation_message_insert ON public.conversation_messages;
CREATE TRIGGER on_conversation_message_insert
AFTER INSERT ON public.conversation_messages
FOR EACH ROW EXECUTE FUNCTION public.handle_new_conversation_message();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);