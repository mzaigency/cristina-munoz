
CREATE OR REPLACE FUNCTION public.check_superadmin_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.email = lower(_email)
      AND ur.role = 'superadmin'
  )
$$;
