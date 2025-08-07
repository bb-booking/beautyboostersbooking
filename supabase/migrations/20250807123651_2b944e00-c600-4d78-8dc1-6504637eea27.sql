-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create beauty services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create boosters table
CREATE TABLE public.boosters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  portfolio_images TEXT[] DEFAULT '{}',
  location_city TEXT,
  location_postal_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boosters ENABLE ROW LEVEL SECURITY;

-- Create booster availability table
CREATE TABLE public.booster_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booster_id UUID NOT NULL REFERENCES public.boosters(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booster_availability ENABLE ROW LEVEL SECURITY;

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booster_id UUID REFERENCES public.boosters(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  booking_type TEXT DEFAULT 'direct', -- direct, quick_booking
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER NOT NULL, -- minutes
  total_price DECIMAL(10,2) NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  notes TEXT,
  quick_booking_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create booking offers table for quick booking
CREATE TABLE public.booking_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  booster_id UUID NOT NULL REFERENCES public.boosters(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, expired
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  response_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_offers ENABLE ROW LEVEL SECURITY;

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booster_id UUID NOT NULL REFERENCES public.boosters(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for services (public read)
CREATE POLICY "Services are viewable by everyone" ON public.services FOR SELECT USING (is_active = true);

-- Create RLS policies for boosters (public read for active boosters)
CREATE POLICY "Active boosters are viewable by everyone" ON public.boosters FOR SELECT USING (is_active = true);
CREATE POLICY "Boosters can update their own profile" ON public.boosters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Boosters can insert their own profile" ON public.boosters FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for availability
CREATE POLICY "Booster availability is viewable by everyone" ON public.booster_availability FOR SELECT USING (true);
CREATE POLICY "Boosters can manage their own availability" ON public.booster_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.boosters WHERE id = booster_id AND user_id = auth.uid())
);

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = customer_id OR 
  EXISTS (SELECT 1 FROM public.boosters WHERE id = booster_id AND user_id = auth.uid())
);
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Participants can update bookings" ON public.bookings FOR UPDATE USING (
  auth.uid() = customer_id OR 
  EXISTS (SELECT 1 FROM public.boosters WHERE id = booster_id AND user_id = auth.uid())
);

-- Create RLS policies for booking offers
CREATE POLICY "Boosters can view offers sent to them" ON public.booking_offers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.boosters WHERE id = booster_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND customer_id = auth.uid())
);
CREATE POLICY "System can create offers" ON public.booking_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Boosters can respond to their offers" ON public.booking_offers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.boosters WHERE id = booster_id AND user_id = auth.uid())
);

-- Create RLS policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create reviews for their bookings" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = customer_id AND 
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND customer_id = auth.uid() AND status = 'completed')
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_boosters_updated_at BEFORE UPDATE ON public.boosters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample services
INSERT INTO public.services (name, description, price, duration, category, difficulty, tags) VALUES
('Bryllup Makeup', 'Professionel bryllup makeup med langvarig finish og prøve-session', 2500, 180, 'Makeup', 'Ekspert', '{"bryllup", "makeup", "langvarig", "prøve"}'),
('Fest Makeup', 'Glamourøs makeup til fest og events', 800, 90, 'Makeup', 'Mellem', '{"fest", "makeup", "glamour", "aften"}'),
('Daglig Makeup', 'Naturlig makeup til hverdag', 400, 45, 'Makeup', 'Begynder', '{"daglig", "makeup", "naturlig"}'),
('Bryllup Hår', 'Elegant bryllup frisure med styling og tilbehør', 1800, 120, 'Hår', 'Ekspert', '{"bryllup", "hår", "opsætning", "styling"}'),
('Fest Hår', 'Professionel hårstyling til fest og galla', 600, 75, 'Hår', 'Mellem', '{"fest", "hår", "styling", "opsætning"}'),
('Blowdry & Styling', 'Smukt blowdry med professionel styling', 300, 45, 'Hår', 'Begynder', '{"blowdry", "styling", "hår"}'),
('Gellak Manicure', 'Holdbar gellak manicure med negledesign', 350, 60, 'Negle', 'Mellem', '{"gellak", "manicure", "negle", "design"}'),
('Bryn & Vipper', 'Brynkorrektion og vippepåsætning', 450, 75, 'Bryn & Vipper', 'Mellem', '{"bryn", "vipper", "korrektion", "påsætning"}');

-- Insert sample boosters
INSERT INTO public.boosters (user_id, display_name, bio, skills, experience_years, hourly_rate, rating, total_reviews, location_city, location_postal_codes) VALUES
('00000000-0000-0000-0000-000000000001', 'Sarah Makeup Artist', 'Professionel makeup artist med speciale i bryllupper og events', '{"makeup", "bryllup", "fest", "contouring"}', 5, 500, 4.8, 127, 'København', '{"1000", "2000", "2100", "2200"}'),
('00000000-0000-0000-0000-000000000002', 'Emma Hair Stylist', 'Kreativ hårstylist med erfaring fra internationale shows', '{"hår", "styling", "opsætning", "extensions"}', 7, 400, 4.9, 89, 'Aarhus', '{"8000", "8200", "8220", "8230"}');

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();