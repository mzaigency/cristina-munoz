-- Fix RLS policy for services to allow anonymous users to view tenant services
DROP POLICY IF EXISTS "Anyone can view tenant services" ON public.services;

CREATE POLICY "Anyone can view tenant services" 
ON public.services 
FOR SELECT 
TO anon, authenticated
USING (
  tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM tenants t 
    WHERE t.id = services.tenant_id 
    AND t.is_active = true
  )
);