-- Update the RPC function to also check subscription expiration
CREATE OR REPLACE FUNCTION public.get_public_tenant_by_slug(_slug text)
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
  show_logo_on_landing boolean,
  theme_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.logo_url,
    t.hero_image_url,
    t.hero_images,
    t.primary_color,
    t.secondary_color,
    t.city,
    t.address,
    t.postal_code,
    t.country,
    t.description,
    t.tagline,
    t.font_heading,
    t.font_body,
    t.heading_size,
    t.button_style,
    t.features,
    t.average_price,
    t.google_maps_url,
    t.instagram_url,
    t.facebook_url,
    t.phone,
    t.whatsapp_number,
    t.email,
    t.show_logo_on_landing,
    t.theme_id
  FROM public.tenants t
  WHERE t.slug = _slug 
    AND t.is_active = true
    AND (t.subscription_expires_at IS NULL OR t.subscription_expires_at > NOW())
  LIMIT 1
$$;