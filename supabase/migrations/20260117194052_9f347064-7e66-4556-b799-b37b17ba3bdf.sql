-- Create error_logs table for frontend error tracking
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_type TEXT,
  component_stack TEXT,
  url TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.error_logs IS 'Stores frontend errors caught by ErrorBoundary for monitoring';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs (error_type);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert errors (including anonymous users)
CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only superadmins can read error logs (using user_roles table)
CREATE POLICY "Superadmins can view error logs"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (public.is_superadmin());

-- Create a function to auto-cleanup old error logs (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.error_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;