-- Add booster_status column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booster_status text DEFAULT 'pending' CHECK (booster_status IN ('pending', 'accepted', 'rejected'));

-- Add assignment attempt tracking
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS assignment_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_assignment_attempt timestamp with time zone;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_booster_status ON public.bookings(booster_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booster_id_status ON public.bookings(booster_id, booster_status);

-- Create function to notify booster about new booking
CREATE OR REPLACE FUNCTION public.notify_booster_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booster_user_id uuid;
BEGIN
  -- Get the user_id for the booster from booster_profiles
  SELECT id INTO booster_user_id
  FROM public.booster_profiles
  WHERE id = NEW.booster_id;

  -- Only send notification if booster is assigned and status is pending
  IF NEW.booster_id IS NOT NULL AND NEW.booster_status = 'pending' AND booster_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      recipient_id,
      title,
      message,
      type
    ) VALUES (
      booster_user_id,
      'Ny booking anmodning',
      'Du har modtaget en ny booking for ' || NEW.service_name || ' den ' || 
      to_char(NEW.booking_date, 'DD/MM/YYYY') || ' kl. ' || 
      to_char(NEW.booking_time, 'HH24:MI') || '. Acceptér eller afvis bookingen.',
      'booking_request'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new bookings
DROP TRIGGER IF EXISTS trigger_notify_booster_new_booking ON public.bookings;
CREATE TRIGGER trigger_notify_booster_new_booking
  AFTER INSERT OR UPDATE OF booster_id, booster_status
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booster_new_booking();

-- Update booster_availability to only show accepted bookings
-- Note: This is handled in application logic, but we can add a comment
COMMENT ON TABLE public.booster_availability IS 'Should only display bookings with booster_status = accepted';