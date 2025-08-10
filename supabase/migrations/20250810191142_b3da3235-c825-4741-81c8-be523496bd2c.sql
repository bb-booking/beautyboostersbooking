-- Add employee_names column to salon_profiles to store names captured during signup
ALTER TABLE public.salon_profiles
ADD COLUMN IF NOT EXISTS employee_names text[] NOT NULL DEFAULT '{}';