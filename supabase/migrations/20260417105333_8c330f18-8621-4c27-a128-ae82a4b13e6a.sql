CREATE POLICY "Tenant staff can create bookings for their tenant"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'stylist'::app_role)
    OR EXISTS (SELECT 1 FROM public.tenant_admins WHERE user_id = auth.uid() AND tenant_id = bookings.tenant_id)
    OR EXISTS (SELECT 1 FROM public.tenant_stylists WHERE user_id = auth.uid() AND tenant_id = bookings.tenant_id AND is_active = true)
  )
);