-- Add private fields to booster_profiles for internal logistics
ALTER TABLE public.booster_profiles 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS private_address text,
ADD COLUMN IF NOT EXISTS private_postal_code text,
ADD COLUMN IF NOT EXISTS private_city text,
ADD COLUMN IF NOT EXISTS cpr_encrypted text,
ADD COLUMN IF NOT EXISTS default_start_time time DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS default_end_time time DEFAULT '17:00',
ADD COLUMN IF NOT EXISTS calendar_provider text,
ADD COLUMN IF NOT EXISTS calendar_sync_token text;

-- Make hourly_rate nullable (we don't want to show prices publicly)
ALTER TABLE public.booster_profiles 
ALTER COLUMN hourly_rate DROP NOT NULL;

-- Create index for user_id lookup
CREATE INDEX IF NOT EXISTS idx_booster_profiles_user_id ON public.booster_profiles(user_id);

-- Update RLS policy to allow boosters to view and update their own profile
CREATE POLICY "Boosters can view their own profile" 
ON public.booster_profiles 
FOR SELECT 
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Boosters can update their own profile" 
ON public.booster_profiles 
FOR UPDATE 
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Keep public read access for non-sensitive fields (handled in app layer)
CREATE POLICY "Public can view basic booster info" 
ON public.booster_profiles 
FOR SELECT 
USING (true);