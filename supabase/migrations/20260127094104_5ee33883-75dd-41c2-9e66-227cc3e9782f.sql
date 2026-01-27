-- Drop the existing check constraint and add 'admin' as a valid type
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_type_check;

-- Add new check constraint with 'admin' included
ALTER TABLE public.conversations ADD CONSTRAINT conversations_type_check 
CHECK (type IN ('customer', 'booster', 'group', 'admin'));