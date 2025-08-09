-- Fix RLS: allow both anon and authenticated via PUBLIC role to insert conversations
DROP POLICY IF EXISTS "Public can create conversations" ON public.conversations;
CREATE POLICY "Anyone can create conversations"
ON public.conversations
FOR INSERT
TO public
WITH CHECK (true);