
-- Add policy to allow admins to delete booster profiles
CREATE POLICY "Admins can delete booster profiles"
ON public.booster_profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
