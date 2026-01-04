-- Add username column to profiles
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Create index for username searches
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Update existing profiles to have unique username based on full_name + partial id
UPDATE public.profiles 
SET username = LOWER(
  REGEXP_REPLACE(
    COALESCE(full_name, SPLIT_PART(email, '@', 1)), 
    '[^a-zA-Z0-9]', 
    '_', 
    'g'
  )
) || '_' || SUBSTRING(id::text FROM 1 FOR 4)
WHERE username IS NULL;

-- Create post_comments table
CREATE TABLE public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for comments
CREATE POLICY "Anyone can view comments" 
ON public.post_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.post_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.post_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.post_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);