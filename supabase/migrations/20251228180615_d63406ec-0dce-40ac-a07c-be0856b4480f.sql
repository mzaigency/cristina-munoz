-- Drop the tenants_n8n_config view as it exposes sensitive data without proper security
DROP VIEW IF EXISTS public.tenants_n8n_config;