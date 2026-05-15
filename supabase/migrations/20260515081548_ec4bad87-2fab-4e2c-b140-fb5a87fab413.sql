UPDATE public.tenants
SET features = COALESCE(features, '{}'::jsonb) || jsonb_build_object(
  'business_type', 'fisioterapia',
  'business_type_label', 'Fisioterapia'
)
WHERE slug = 'montserratfaig';