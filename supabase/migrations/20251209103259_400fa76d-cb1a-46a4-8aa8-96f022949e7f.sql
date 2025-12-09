-- Insert Louise Bencard as a booster profile with her auth user_id as the profile id
INSERT INTO public.booster_profiles (id, name, location, hourly_rate, specialties, bio, is_available, rating, review_count, years_experience)
VALUES (
  '91f01c57-dfa2-402d-b2ad-b5fc979fe0b7',
  'Louise Bencard',
  'København',
  650,
  ARRAY['Makeup artist', 'Hårstylist', 'SFX', 'Makeup Styling'],
  'Erfaren makeup artist med speciale i makeup styling, hår og special effects makeup. Passioneret om at skabe unikke looks til enhver lejlighed.',
  true,
  5.0,
  0,
  5
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  specialties = EXCLUDED.specialties,
  bio = EXCLUDED.bio;