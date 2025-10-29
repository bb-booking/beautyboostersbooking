-- Extend conversations table to support different types and groups
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'customer' CHECK (type IN ('customer', 'booster', 'group')),
ADD COLUMN IF NOT EXISTS participants jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS group_name text,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_priority ON public.conversations(priority);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON public.conversations(archived);

-- Add booster_id to conversation_messages for tracking which booster sent the message
ALTER TABLE public.conversation_messages
ADD COLUMN IF NOT EXISTS booster_id uuid REFERENCES public.booster_profiles(id);

COMMENT ON COLUMN public.conversations.type IS 'Type of conversation: customer (from website), booster (direct message to booster), group (group chat)';
COMMENT ON COLUMN public.conversations.participants IS 'Array of booster_ids for direct messages and group chats';
COMMENT ON COLUMN public.conversations.priority IS 'Priority level for admin to track important conversations';
COMMENT ON COLUMN public.conversations.tags IS 'Tags for categorization (e.g., booking, support, urgent)';