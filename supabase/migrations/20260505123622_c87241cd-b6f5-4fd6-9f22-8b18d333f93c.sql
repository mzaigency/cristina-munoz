
-- Bug 2: Allow tenant admins to update their own tenant
CREATE POLICY "Tenant admins can update their tenant"
ON public.tenants FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.tenant_admins ta WHERE ta.tenant_id = tenants.id AND ta.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_admins ta WHERE ta.tenant_id = tenants.id AND ta.user_id = auth.uid()));

-- Bug 1: SuperAdmin can manage tenant-assets storage
CREATE POLICY "SuperAdmin can upload tenant assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tenant-assets' AND public.is_superadmin());

CREATE POLICY "SuperAdmin can update tenant assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tenant-assets' AND public.is_superadmin());

CREATE POLICY "SuperAdmin can delete tenant assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tenant-assets' AND public.is_superadmin());
