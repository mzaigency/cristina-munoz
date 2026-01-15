-- Create push_tokens table for storing FCM tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert own tokens
CREATE POLICY "Users can insert own tokens"
  ON public.push_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own tokens
CREATE POLICY "Users can update own tokens"
  ON public.push_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete own tokens
CREATE POLICY "Users can delete own tokens"
  ON public.push_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can read all tokens (for sending notifications)
CREATE POLICY "Service role can read all tokens"
  ON public.push_tokens
  FOR SELECT
  TO service_role
  USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);