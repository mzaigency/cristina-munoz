-- Drop and recreate the function to include show_logo_on_landing field
DROP FUNCTION IF EXISTS public.get_public_tenant_by_slug(text);

CREATE FUNCTION public.get_public_tenant_by_slug(_slug text)
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
  postal_code text,
  country text,
  description text,
  tagline text,
  font_heading text,
  font_body text,
  heading_size text,
  button_style text,
  features jsonb,
  average_price numeric,
  google_maps_url text,
  instagram_url text,
  facebook_url text,
  phone text,
  whatsapp_number text,
  email text,
  show_logo_on_landing boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    slug,
    logo_url,
    hero_image_url,
    hero_images,
    primary_color,
    secondary_color,
    city,
    address,
    postal_code,
    country,
    description,
    tagline,
    font_heading,
    font_body,
    heading_size,
    button_style,
    features,
    average_price,
    google_maps_url,
    instagram_url,
    facebook_url,
    phone,
    whatsapp_number,
    email,
    show_logo_on_landing
  FROM public.tenants
  WHERE slug = _slug AND is_active = true
  LIMIT 1
$$;