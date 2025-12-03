-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on booster_availability" ON public.booster_availability;

-- Boosters can manage their own availability
CREATE POLICY "Boosters can manage own availability"
ON public.booster_availability
FOR ALL
USING (booster_id = auth.uid() AND public.has_role(auth.uid(), 'booster'))
WITH CHECK (booster_id = auth.uid() AND public.has_role(auth.uid(), 'booster'));

-- Admins can manage all availability
CREATE POLICY "Admins can manage all availability"
ON public.booster_availability
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can view availability (needed for booking flow)
CREATE POLICY "Anyone can view availability"
ON public.booster_availability
FOR SELECT
USING (true);