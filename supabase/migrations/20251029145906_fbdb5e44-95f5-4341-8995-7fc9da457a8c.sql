-- Create table for booster booking requests
CREATE TABLE public.booster_booking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  booster_id UUID REFERENCES public.booster_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  responded_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  response_message TEXT,
  notified_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(booking_id, booster_id)
);

-- Enable RLS
ALTER TABLE public.booster_booking_requests ENABLE ROW LEVEL SECURITY;

-- Admins can manage all requests
CREATE POLICY "Admins can manage booking requests"
  ON public.booster_booking_requests
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Boosters can view their own requests
CREATE POLICY "Boosters can view their own requests"
  ON public.booster_booking_requests
  FOR SELECT
  USING (booster_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Boosters can update their own requests
CREATE POLICY "Boosters can respond to their own requests"
  ON public.booster_booking_requests
  FOR UPDATE
  USING (booster_id = auth.uid() AND status = 'pending')
  WITH CHECK (booster_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_booster_booking_requests_booster_id ON public.booster_booking_requests(booster_id);
CREATE INDEX idx_booster_booking_requests_booking_id ON public.booster_booking_requests(booking_id);
CREATE INDEX idx_booster_booking_requests_status ON public.booster_booking_requests(status);

-- Create notifications for boosters
CREATE OR REPLACE FUNCTION public.notify_booster_of_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for the booster
  INSERT INTO public.notifications (
    recipient_id,
    title,
    message,
    type
  ) VALUES (
    NEW.booster_id,
    'Ny booking forespørgsel',
    'Du har modtaget en ny booking forespørgsel. Se dine booking anmodninger for detaljer.',
    'booking_request'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_booking_request_created
  AFTER INSERT ON public.booster_booking_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_booster_of_request();

-- Function to handle accepted request
CREATE OR REPLACE FUNCTION public.handle_booking_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if status changed to accepted
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Update the booking with the accepted booster
    UPDATE public.bookings
    SET 
      booster_id = NEW.booster_id,
      booster_status = 'accepted',
      booster_name = (SELECT name FROM public.booster_profiles WHERE id = NEW.booster_id),
      updated_at = now()
    WHERE id = NEW.booking_id;
    
    -- Cancel all other pending requests for this booking
    UPDATE public.booster_booking_requests
    SET status = 'cancelled', responded_at = now()
    WHERE booking_id = NEW.booking_id 
      AND id != NEW.id 
      AND status = 'pending';
      
    -- Add to booster availability
    INSERT INTO public.booster_availability (
      booster_id,
      date,
      start_time,
      end_time,
      status,
      job_id
    )
    SELECT
      NEW.booster_id,
      b.booking_date,
      b.booking_time,
      (b.booking_time::time + (b.duration_hours || ' hours')::interval)::time,
      'booked',
      NEW.booking_id::text
    FROM public.bookings b
    WHERE b.id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_booking_request_accepted
  AFTER UPDATE ON public.booster_booking_requests
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION public.handle_booking_request_acceptance();