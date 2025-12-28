-- Create a simplified view for n8n integrations
CREATE OR REPLACE VIEW public.tenants_n8n_config AS
SELECT 
  id as tenant_id,
  slug,
  name,
  whatsapp_number,
  phone,
  email,
  timezone,
  is_active
FROM public.tenants
WHERE is_active = true;

-- Grant access to the view (service role will use this)
GRANT SELECT ON public.tenants_n8n_config TO service_role;