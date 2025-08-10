-- Add 'salon' to app_role enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'salon'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'salon';
  END IF;
END $$;

-- Create salon_profiles table
CREATE TABLE IF NOT EXISTS public.salon_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cvr TEXT,
  industry TEXT,
  employees_count INTEGER,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  services TEXT[] NOT NULL DEFAULT '{}'::text[],
  opening_hours JSONB,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salon_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'salon_profiles' AND policyname = 'Public can view salons'
  ) THEN
    CREATE POLICY "Public can view salons"
    ON public.salon_profiles
    FOR SELECT
    USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'salon_profiles' AND policyname = 'Users can insert their own salon profile'
  ) THEN
    CREATE POLICY "Users can insert their own salon profile"
    ON public.salon_profiles
    FOR INSERT
    WITH CHECK (owner_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'salon_profiles' AND policyname = 'Users can update their own salon profile'
  ) THEN
    CREATE POLICY "Users can update their own salon profile"
    ON public.salon_profiles
    FOR UPDATE
    USING (owner_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'salon_profiles' AND policyname = 'Users can delete their own salon profile'
  ) THEN
    CREATE POLICY "Users can delete their own salon profile"
    ON public.salon_profiles
    FOR DELETE
    USING (owner_user_id = auth.uid());
  END IF;
END $$;

-- Trigger to update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_salon_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_salon_profiles_updated_at
    BEFORE UPDATE ON public.salon_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Allow users to add 'salon' role for themselves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can add salon role for themselves'
  ) THEN
    CREATE POLICY "Users can add salon role for themselves"
    ON public.user_roles
    FOR INSERT
    WITH CHECK ((user_id = auth.uid()) AND (role = 'salon'::app_role));
  END IF;
END $$;