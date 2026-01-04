-- Update the handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, username)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'username'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    username = EXCLUDED.username,
    updated_at = now();
  RETURN new;
END;
$$;