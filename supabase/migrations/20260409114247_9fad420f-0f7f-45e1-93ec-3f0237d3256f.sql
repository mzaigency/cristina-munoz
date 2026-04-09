
CREATE TABLE public.tenant_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  steps_completed JSONB DEFAULT '{}',
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenant_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins can manage their onboarding progress"
ON public.tenant_onboarding_progress
FOR ALL
USING (
  tenant_id = get_user_tenant_id() AND EXISTS (
    SELECT 1 FROM public.tenant_admins
    WHERE tenant_admins.tenant_id = tenant_onboarding_progress.tenant_id
    AND tenant_admins.user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id = get_user_tenant_id() AND EXISTS (
    SELECT 1 FROM public.tenant_admins
    WHERE tenant_admins.tenant_id = tenant_onboarding_progress.tenant_id
    AND tenant_admins.user_id = auth.uid()
  )
);

CREATE POLICY "SuperAdmin can manage all onboarding progress"
ON public.tenant_onboarding_progress
FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE TRIGGER update_tenant_onboarding_progress_updated_at
BEFORE UPDATE ON public.tenant_onboarding_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
