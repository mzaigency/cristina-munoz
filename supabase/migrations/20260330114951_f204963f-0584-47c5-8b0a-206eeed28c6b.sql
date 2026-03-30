
CREATE POLICY "SuperAdmin can manage app_config"
ON public.app_config
FOR ALL
TO authenticated
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());
