-- Add location columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Update existing profiles with default location (España, Barcelona, Santpedor)
UPDATE public.profiles
SET 
  country = 'España',
  province = 'Barcelona',
  city = 'Santpedor'
WHERE country IS NULL;

-- Update handle_new_user function to include location fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, username, country, province, city)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'username',
    COALESCE(new.raw_user_meta_data ->> 'country', 'España'),
    new.raw_user_meta_data ->> 'province',
    new.raw_user_meta_data ->> 'city'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    username = EXCLUDED.username,
    country = COALESCE(EXCLUDED.country, profiles.country),
    province = COALESCE(EXCLUDED.province, profiles.province),
    city = COALESCE(EXCLUDED.city, profiles.city),
    updated_at = now();
  RETURN new;
END;
$$;