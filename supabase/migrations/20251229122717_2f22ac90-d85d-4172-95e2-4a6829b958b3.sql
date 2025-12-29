-- Drop all existing SELECT policies on services and recreate properly
DROP POLICY IF EXISTS "Anyone can view tenant services" ON public.services;
DROP POLICY IF EXISTS "Tenant admins can manage their services" ON public.services;
DROP POLICY IF EXISTS "SuperAdmin can manage all services" ON public.services;

-- Create a PERMISSIVE policy for public reading (this is the default behavior)
CREATE POLICY "Public can view active tenant services" 
ON public.services 
FOR SELECT 
USING (
  tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM tenants t 
    WHERE t.id = services.tenant_id 
    AND t.is_active = true
  )
);

-- Recreate admin policies for managing services
CREATE POLICY "SuperAdmin can manage all services" 
ON public.services 
FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Tenant admins can manage their services" 
ON public.services 
FOR ALL
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
)
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);