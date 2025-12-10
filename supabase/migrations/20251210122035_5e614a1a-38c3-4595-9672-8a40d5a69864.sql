-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view chat images (they're tied to job_id)
CREATE POLICY "Chat images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat-images');

-- Allow authenticated users to upload chat images
CREATE POLICY "Authenticated users can upload chat images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');

-- Allow anyone to upload chat images (for non-authenticated scenarios)
CREATE POLICY "Anyone can upload chat images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chat-images');