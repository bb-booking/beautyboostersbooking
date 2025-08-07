-- Create bookings table for payment tracking
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  service_name TEXT NOT NULL,
  booster_id UUID,
  booster_name TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_hours INTEGER DEFAULT 2,
  amount DECIMAL(10,2) NOT NULL,
  payment_intent_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  location TEXT,
  special_requests TEXT,
  cancellation_policy_accepted BOOLEAN DEFAULT false,
  payment_captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to insert bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public to view bookings by email" 
ON public.bookings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public to update bookings" 
ON public.bookings 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();