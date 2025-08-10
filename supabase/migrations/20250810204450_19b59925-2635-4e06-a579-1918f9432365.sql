-- Apply secure RLS policy for booking_reminders only
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage booking reminders" ON public.booking_reminders;
CREATE POLICY "Admins can manage booking reminders"
ON public.booking_reminders
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));