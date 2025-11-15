-- Remove the overly permissive public read policy on password_reset_tokens
-- This prevents unauthorized access to password reset tokens
DROP POLICY IF EXISTS "Anyone can read password reset tokens" ON public.password_reset_tokens;

-- Keep only the user-scoped policy that allows users to view their own tokens
-- The existing policy "Users can view their own password reset tokens" remains active
-- Edge functions will continue to work as they use SUPABASE_SERVICE_ROLE_KEY