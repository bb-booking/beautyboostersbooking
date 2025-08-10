-- Fix 1: Add RLS policies for booking_reminders (RLS enabled but no policies)
-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies to manage reminders
DROP POLICY IF EXISTS "Admins can manage booking reminders" ON public.booking_reminders;
CREATE POLICY "Admins can manage booking reminders"
ON public.booking_reminders
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Optionally allow inserts from authenticated users if needed in future (kept disabled for now)
-- CREATE POLICY "Authenticated can insert booking reminders for themselves"
-- ON public.booking_reminders
-- FOR INSERT
-- WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Move extension installed in public schema to extensions schema
-- Linter flagged: pg_net is in public; move to extensions schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_net' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'ALTER EXTENSION pg_net SET SCHEMA extensions';
  END IF;
END $$;