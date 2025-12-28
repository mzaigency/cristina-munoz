-- Add WhatsApp sender ID to tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS whatsapp_sender_id text;

-- Drop and recreate the view with the new column
DROP VIEW IF EXISTS public.tenants_n8n_config;

CREATE VIEW public.tenants_n8n_config AS
SELECT 
  id as tenant_id,
  slug,
  name,
  whatsapp_number,
  whatsapp_sender_id,
  phone,
  email,
  timezone,
  is_active
FROM public.tenants
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.tenants_n8n_config TO service_role;