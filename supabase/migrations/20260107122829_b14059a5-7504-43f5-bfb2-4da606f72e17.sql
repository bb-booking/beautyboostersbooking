-- Update Stephanie with private details (CPR is base64 encoded for basic protection - should use proper encryption in production)
UPDATE public.booster_profiles 
SET 
  email = 'stephanie@beautyboosters.dk',
  private_address = 'Næstvedgade 14, 2. th',
  private_postal_code = '2100',
  private_city = 'København Ø',
  cpr_encrypted = encode(convert_to('240196-1170', 'UTF8'), 'base64'),
  default_start_time = '09:00',
  default_end_time = '17:00',
  calendar_provider = 'outlook',
  hourly_rate = NULL
WHERE name = 'Stephanie';

-- Remove hourly_rate from all boosters (set to NULL)
UPDATE public.booster_profiles 
SET hourly_rate = NULL 
WHERE hourly_rate IS NOT NULL;

-- Insert default availability for Stephanie (every day 09-17 for the next 30 days)
INSERT INTO public.booster_availability (booster_id, date, start_time, end_time, status, notes)
SELECT 
  'eff0f000-069d-45eb-a711-638c408363c8'::uuid,
  current_date + i,
  '09:00'::time,
  '17:00'::time,
  'available',
  'Standard tilgængelighed'
FROM generate_series(0, 30) AS i
ON CONFLICT DO NOTHING;