-- Add tenant_id column to user_roles for tenant-specific roles like stylist
ALTER TABLE public.user_roles 
ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Drop the existing unique constraint and create a new one that includes tenant_id
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_tenant_key UNIQUE (user_id, role, tenant_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON public.user_roles(tenant_id) WHERE tenant_id IS NOT NULL;

-- Update has_role function to optionally check tenant
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role, _tenant_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (tenant_id IS NULL OR tenant_id = _tenant_id OR _tenant_id IS NULL)
  )
$$;