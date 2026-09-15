DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view tenant-scoped roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    public.has_role(auth.uid(), 'admin'::app_role, NULL::uuid)
    AND tenant_id IS NOT NULL
    AND tenant_id = public.get_user_tenant_id()
  )
);