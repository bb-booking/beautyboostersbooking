-- Create customer_addresses table for saved addresses
CREATE TABLE public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_addresses
CREATE POLICY "Users can manage their own addresses"
  ON public.customer_addresses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create customer_favorites table for favorite boosters
CREATE TABLE public.customer_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booster_id UUID NOT NULL REFERENCES public.booster_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, booster_id)
);

-- Enable RLS
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_favorites
CREATE POLICY "Users can manage their own favorites"
  ON public.customer_favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create booking_reviews table for ratings and reviews
CREATE TABLE public.booking_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booster_id UUID NOT NULL REFERENCES public.booster_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE public.booking_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_reviews
CREATE POLICY "Users can create reviews for their own bookings"
  ON public.booking_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.booking_reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view reviews"
  ON public.booking_reviews
  FOR SELECT
  USING (true);

-- Create function to update booster rating
CREATE OR REPLACE FUNCTION public.update_booster_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.booster_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 5.0)
      FROM public.booking_reviews
      WHERE booster_id = NEW.booster_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.booking_reviews
      WHERE booster_id = NEW.booster_id
    )
  WHERE id = NEW.booster_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update booster rating on review insert/update
CREATE TRIGGER update_booster_rating_trigger
AFTER INSERT OR UPDATE ON public.booking_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_booster_rating();

-- Add trigger for updated_at on customer_addresses
CREATE TRIGGER update_customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on booking_reviews
CREATE TRIGGER update_booking_reviews_updated_at
BEFORE UPDATE ON public.booking_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();