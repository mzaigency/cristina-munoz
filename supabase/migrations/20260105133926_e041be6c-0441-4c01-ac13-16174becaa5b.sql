-- 1. Drop existing constraint that allows duplicates
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_tenant_id_key;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- 2. Create partial unique index for global roles (tenant_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_unique_global 
ON public.user_roles (user_id, role) 
WHERE tenant_id IS NULL;

-- 3. Create partial unique index for tenant-specific roles
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_unique_tenant 
ON public.user_roles (user_id, role, tenant_id) 
WHERE tenant_id IS NOT NULL;

-- 4. Update get_user_tenant_id() to also check tenant_stylists for stylists
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    -- First check tenant_admins
    (SELECT tenant_id FROM public.tenant_admins WHERE user_id = auth.uid() LIMIT 1),
    -- Then check tenant_stylists
    (SELECT tenant_id FROM public.tenant_stylists WHERE user_id = auth.uid() AND is_active = true LIMIT 1)
  )
$function$;