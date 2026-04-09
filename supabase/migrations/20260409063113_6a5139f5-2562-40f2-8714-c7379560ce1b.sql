
-- Public function to check username/email availability (no auth required)
CREATE OR REPLACE FUNCTION public.check_availability(
  p_username text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
BEGIN
  IF p_username IS NOT NULL AND length(trim(p_username)) >= 3 THEN
    result := result || jsonb_build_object(
      'username_taken',
      EXISTS(SELECT 1 FROM public.profiles WHERE lower(username) = lower(trim(p_username)))
    );
  END IF;

  IF p_email IS NOT NULL AND length(trim(p_email)) >= 5 THEN
    result := result || jsonb_build_object(
      'email_taken',
      EXISTS(SELECT 1 FROM public.profiles WHERE lower(email) = lower(trim(p_email)))
    );
  END IF;

  RETURN result;
END;
$$;

-- Case-insensitive unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
ON public.profiles (lower(username))
WHERE username IS NOT NULL;
