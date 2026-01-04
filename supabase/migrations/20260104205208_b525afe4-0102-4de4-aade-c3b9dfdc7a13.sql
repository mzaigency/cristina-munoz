-- Create storage bucket for posts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('posts', 'posts', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their tenant folder
CREATE POLICY "Tenant admins can upload posts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.tenant_admins 
    WHERE user_id = auth.uid() 
    AND tenant_id::text = (storage.foldername(name))[1]
  )
);

-- Allow public read access to posts
CREATE POLICY "Posts images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- Allow tenant admins to delete their posts
CREATE POLICY "Tenant admins can delete their posts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.tenant_admins 
    WHERE user_id = auth.uid() 
    AND tenant_id::text = (storage.foldername(name))[1]
  )
);