
-- Create storage bucket for analysis images
INSERT INTO storage.buckets (id, name, public)
VALUES ('analysis-images', 'analysis-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload analysis images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'analysis-images');

-- Allow anyone to view analysis images (public blog)
CREATE POLICY "Anyone can view analysis images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'analysis-images');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own analysis images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'analysis-images' AND (storage.foldername(name))[1] = auth.uid()::text);
