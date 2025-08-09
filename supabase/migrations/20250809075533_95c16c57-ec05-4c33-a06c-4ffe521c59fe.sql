-- Safe migration: move extensions to extensions schema and add deny-all RLS policies if table exists

-- Move pg_cron to extensions schema if installed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    EXECUTE 'ALTER EXTENSION pg_cron SET SCHEMA extensions';
  END IF;
END$$;

-- Move pg_net to extensions schema if installed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    EXECUTE 'ALTER EXTENSION pg_net SET SCHEMA extensions';
  END IF;
END$$;

-- Add explicit deny-all RLS policies for booking_reminders if table exists
DO $$
BEGIN
  IF to_regclass('public.booking_reminders') IS NOT NULL THEN
    -- SELECT policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'booking_reminders' 
        AND policyname = 'No public select booking_reminders'
    ) THEN
      EXECUTE 'CREATE POLICY "No public select booking_reminders" ON public.booking_reminders FOR SELECT USING (false)';
    END IF;

    -- INSERT policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'booking_reminders' 
        AND policyname = 'No public insert booking_reminders'
    ) THEN
      EXECUTE 'CREATE POLICY "No public insert booking_reminders" ON public.booking_reminders FOR INSERT WITH CHECK (false)';
    END IF;

    -- UPDATE policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'booking_reminders' 
        AND policyname = 'No public update booking_reminders'
    ) THEN
      EXECUTE 'CREATE POLICY "No public update booking_reminders" ON public.booking_reminders FOR UPDATE USING (false)';
    END IF;

    -- DELETE policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'booking_reminders' 
        AND policyname = 'No public delete booking_reminders'
    ) THEN
      EXECUTE 'CREATE POLICY "No public delete booking_reminders" ON public.booking_reminders FOR DELETE USING (false)';
    END IF;
  END IF;
END$$;