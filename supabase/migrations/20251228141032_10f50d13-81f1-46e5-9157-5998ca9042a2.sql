-- Create storage bucket for story images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-images',
  'story-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for story images
CREATE POLICY "Anyone can view story images"
ON storage.objects FOR SELECT
USING (bucket_id = 'story-images');

CREATE POLICY "Authenticated users can upload story images to their tenant folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'story-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Tenant staff can delete their story images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'story-images'
  AND auth.role() = 'authenticated'
);