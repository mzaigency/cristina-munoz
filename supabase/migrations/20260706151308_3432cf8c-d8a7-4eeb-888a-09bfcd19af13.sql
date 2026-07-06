CREATE OR REPLACE FUNCTION public.get_public_tenants()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  hero_image_url text,
  hero_images jsonb,
  primary_color text,
  secondary_color text,
  city text,
  address text,
  description text,
  tagline text,
  features jsonb,
  average_price numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, name, slug, logo_url, hero_image_url, hero_images,
    primary_color, secondary_color, city, address, description,
    tagline, features, average_price
  FROM public.tenants
  WHERE is_active = true
    AND COALESCE((features->>'demo')::boolean, false) = false
$$;