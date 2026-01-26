-- Create storage bucket for booking inspiration images
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-images', 'booking-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for booking images
CREATE TABLE public.booking_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view booking images (needed for boosters and admins)
CREATE POLICY "Anyone can view booking images"
  ON public.booking_images
  FOR SELECT
  USING (true);

-- Anyone can insert booking images (during booking flow)
CREATE POLICY "Anyone can insert booking images"
  ON public.booking_images
  FOR INSERT
  WITH CHECK (true);

-- Admins can delete booking images
CREATE POLICY "Admins can delete booking images"
  ON public.booking_images
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Storage policies for booking-images bucket
CREATE POLICY "Anyone can upload booking images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'booking-images');

CREATE POLICY "Anyone can view booking images storage"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'booking-images');

CREATE POLICY "Admins can delete booking images storage"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'booking-images' AND has_role(auth.uid(), 'admin'));