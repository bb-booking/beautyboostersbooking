-- Create table for booster portfolio images
CREATE TABLE public.booster_portfolio_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booster_id UUID NOT NULL REFERENCES public.booster_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  role TEXT,
  project_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sort_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.booster_portfolio_images ENABLE ROW LEVEL SECURITY;

-- Boosters can manage their own portfolio images
CREATE POLICY "Boosters can manage their own portfolio images"
ON public.booster_portfolio_images
FOR ALL
USING (
  booster_id IN (
    SELECT id FROM public.booster_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  booster_id IN (
    SELECT id FROM public.booster_profiles WHERE user_id = auth.uid()
  )
);

-- Admins can manage all portfolio images
CREATE POLICY "Admins can manage all portfolio images"
ON public.booster_portfolio_images
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view portfolio images (public profiles)
CREATE POLICY "Anyone can view portfolio images"
ON public.booster_portfolio_images
FOR SELECT
USING (true);

-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('booster-portfolio', 'booster-portfolio', true);

-- Storage policies for portfolio images
CREATE POLICY "Anyone can view portfolio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'booster-portfolio');

CREATE POLICY "Boosters can upload their own portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'booster-portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Boosters can delete their own portfolio images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'booster-portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage all portfolio images in storage"
ON storage.objects FOR ALL
USING (
  bucket_id = 'booster-portfolio' 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'booster-portfolio' 
  AND has_role(auth.uid(), 'admin'::app_role)
);