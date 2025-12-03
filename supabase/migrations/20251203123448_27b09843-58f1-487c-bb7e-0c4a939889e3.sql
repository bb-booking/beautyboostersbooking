-- Fix conversations RLS - currently allows all authenticated users to read/update
DROP POLICY IF EXISTS "Admins can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON public.conversations;

-- Only admins can view conversations
CREATE POLICY "Admins can view conversations"
ON public.conversations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update conversations
CREATE POLICY "Admins can update conversations"
ON public.conversations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add policy for boosters to view their assigned bookings
CREATE POLICY "Boosters can view assigned bookings"
ON public.bookings
FOR SELECT
USING (
  booster_id = auth.uid() AND public.has_role(auth.uid(), 'booster')
);