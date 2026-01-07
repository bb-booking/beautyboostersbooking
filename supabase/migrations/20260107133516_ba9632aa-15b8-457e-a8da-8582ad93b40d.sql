-- Add employment_type to booster_profiles
ALTER TABLE public.booster_profiles 
ADD COLUMN IF NOT EXISTS employment_type text DEFAULT 'freelancer' CHECK (employment_type IN ('freelancer', 'salaried'));

-- Update Stephanie to salaried
UPDATE public.booster_profiles 
SET employment_type = 'salaried'
WHERE name = 'Stephanie';