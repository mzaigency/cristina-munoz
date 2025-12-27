-- =============================================
-- FASE 1C: FUNCIONES HELPER Y POLÍTICAS RLS
-- =============================================

-- 9. Crear función is_superadmin()
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'superadmin'
  )
$$;

-- 10. Crear función get_user_tenant_id()
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.tenant_admins
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- 11. Crear función get_tenant_by_slug()
CREATE OR REPLACE FUNCTION public.get_tenant_by_slug(_slug TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.tenants
  WHERE slug = _slug AND is_active = true
  LIMIT 1
$$;

-- 12. Crear función para verificar si usuario pertenece a un tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_admins
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  ) OR EXISTS (
    SELECT 1
    FROM public.tenant_stylists
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

-- 13. Políticas RLS para tenants
CREATE POLICY "SuperAdmin can view all tenants"
ON public.tenants FOR SELECT
USING (is_superadmin());

CREATE POLICY "SuperAdmin can insert tenants"
ON public.tenants FOR INSERT
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can update tenants"
ON public.tenants FOR UPDATE
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can delete tenants"
ON public.tenants FOR DELETE
USING (is_superadmin());

CREATE POLICY "Tenant admins can view their tenant"
ON public.tenants FOR SELECT
USING (id = get_user_tenant_id());

-- 14. Políticas RLS para tenant_admins
CREATE POLICY "SuperAdmin can view all tenant_admins"
ON public.tenant_admins FOR SELECT
USING (is_superadmin());

CREATE POLICY "SuperAdmin can insert tenant_admins"
ON public.tenant_admins FOR INSERT
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can update tenant_admins"
ON public.tenant_admins FOR UPDATE
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can delete tenant_admins"
ON public.tenant_admins FOR DELETE
USING (is_superadmin());

CREATE POLICY "Tenant owners can view their tenant admins"
ON public.tenant_admins FOR SELECT
USING (tenant_id = get_user_tenant_id());

-- 15. Políticas RLS para tenant_stylists
CREATE POLICY "SuperAdmin can view all tenant_stylists"
ON public.tenant_stylists FOR SELECT
USING (is_superadmin());

CREATE POLICY "SuperAdmin can insert tenant_stylists"
ON public.tenant_stylists FOR INSERT
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can update tenant_stylists"
ON public.tenant_stylists FOR UPDATE
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can delete tenant_stylists"
ON public.tenant_stylists FOR DELETE
USING (is_superadmin());

CREATE POLICY "Tenant admins can view their stylists"
ON public.tenant_stylists FOR SELECT
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can insert their stylists"
ON public.tenant_stylists FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can update their stylists"
ON public.tenant_stylists FOR UPDATE
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can delete their stylists"
ON public.tenant_stylists FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- 16. Políticas RLS para tenant_business_hours
CREATE POLICY "SuperAdmin can view all business_hours"
ON public.tenant_business_hours FOR SELECT
USING (is_superadmin());

CREATE POLICY "SuperAdmin can insert business_hours"
ON public.tenant_business_hours FOR INSERT
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can update business_hours"
ON public.tenant_business_hours FOR UPDATE
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can delete business_hours"
ON public.tenant_business_hours FOR DELETE
USING (is_superadmin());

CREATE POLICY "Tenant admins can view their business hours"
ON public.tenant_business_hours FOR SELECT
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can insert their business hours"
ON public.tenant_business_hours FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can update their business hours"
ON public.tenant_business_hours FOR UPDATE
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can delete their business hours"
ON public.tenant_business_hours FOR DELETE
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Anyone can view active tenant business hours"
ON public.tenant_business_hours FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenants t 
    WHERE t.id = tenant_id AND t.is_active = true
  )
);

-- 17. Políticas RLS para tenant_integrations
CREATE POLICY "SuperAdmin can view all integrations"
ON public.tenant_integrations FOR SELECT
USING (is_superadmin());

CREATE POLICY "SuperAdmin can insert integrations"
ON public.tenant_integrations FOR INSERT
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can update integrations"
ON public.tenant_integrations FOR UPDATE
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can delete integrations"
ON public.tenant_integrations FOR DELETE
USING (is_superadmin());

CREATE POLICY "Tenant admins can view their integrations"
ON public.tenant_integrations FOR SELECT
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can insert their integrations"
ON public.tenant_integrations FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can update their integrations"
ON public.tenant_integrations FOR UPDATE
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can delete their integrations"
ON public.tenant_integrations FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- 18. Políticas RLS para tenant_encryption_keys (solo superadmin)
CREATE POLICY "SuperAdmin can view encryption keys"
ON public.tenant_encryption_keys FOR SELECT
USING (is_superadmin());

CREATE POLICY "SuperAdmin can insert encryption keys"
ON public.tenant_encryption_keys FOR INSERT
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can update encryption keys"
ON public.tenant_encryption_keys FOR UPDATE
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "SuperAdmin can delete encryption keys"
ON public.tenant_encryption_keys FOR DELETE
USING (is_superadmin());

-- 19. Trigger para actualizar updated_at en tenants
CREATE OR REPLACE FUNCTION public.update_tenant_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_tenant_updated_at();

CREATE TRIGGER update_tenant_stylists_updated_at
BEFORE UPDATE ON public.tenant_stylists
FOR EACH ROW
EXECUTE FUNCTION public.update_tenant_updated_at();

CREATE TRIGGER update_tenant_integrations_updated_at
BEFORE UPDATE ON public.tenant_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_tenant_updated_at();