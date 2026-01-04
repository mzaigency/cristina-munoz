-- Add video_url column to salon_stories
ALTER TABLE public.salon_stories 
ADD COLUMN IF NOT EXISTS video_url text;

-- Create storage bucket for story videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-videos', 'story-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access for story videos
CREATE POLICY "Story videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'story-videos');

-- Allow authenticated users to upload story videos
CREATE POLICY "Authenticated users can upload story videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'story-videos' AND auth.role() = 'authenticated');

-- Allow users to delete their own story videos
CREATE POLICY "Users can delete their own story videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'story-videos' AND auth.uid()::text = (storage.foldername(name))[1]);