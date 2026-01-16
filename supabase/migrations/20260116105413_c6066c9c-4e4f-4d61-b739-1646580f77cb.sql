-- Create storage bucket for booster profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('booster-avatars', 'booster-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for users to upload their own avatars
CREATE POLICY "Boosters can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'booster-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to update their own avatars
CREATE POLICY "Boosters can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'booster-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete their own avatars
CREATE POLICY "Boosters can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'booster-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Anyone can view booster avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'booster-avatars');