-- Ensure enum exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','booster');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create table if needed
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;

-- Create policies if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can read their own roles'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can read their own roles"
      ON public.user_roles FOR SELECT TO authenticated
      USING (user_id = auth.uid());
    $$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can add booster role for themselves'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can add booster role for themselves"
      ON public.user_roles FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() AND role = 'booster');
    $$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can manage user roles'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Admins can manage user roles"
      ON public.user_roles FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
    $$;
  END IF;
END $$;

-- Seed admin role for primary admin email if present
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'hello@beautyboosters.dk'
ON CONFLICT DO NOTHING;