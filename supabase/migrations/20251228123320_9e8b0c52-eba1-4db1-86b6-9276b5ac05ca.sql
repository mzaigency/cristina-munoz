-- Allow anyone to view active stylists from active tenants (needed for booking flow)
CREATE POLICY "Anyone can view active tenant stylists" 
ON public.tenant_stylists 
FOR SELECT 
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM tenants t 
    WHERE t.id = tenant_stylists.tenant_id 
    AND t.is_active = true
  )
);