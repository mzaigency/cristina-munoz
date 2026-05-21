
CREATE TABLE IF NOT EXISTS public.stylist_hours_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  stylist_id uuid NOT NULL,
  date_from date NOT NULL,
  date_to date NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  open_time time,
  close_time time,
  break_start time,
  break_end time,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stylist_hours_overrides_lookup
  ON public.stylist_hours_overrides (stylist_id, date_from, date_to);

CREATE INDEX IF NOT EXISTS idx_stylist_hours_overrides_tenant
  ON public.stylist_hours_overrides (tenant_id);

ALTER TABLE public.stylist_hours_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins manage stylist overrides"
  ON public.stylist_hours_overrides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_admins ta
      WHERE ta.tenant_id = stylist_hours_overrides.tenant_id
        AND ta.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_admins ta
      WHERE ta.tenant_id = stylist_hours_overrides.tenant_id
        AND ta.user_id = auth.uid()
    )
  );

CREATE POLICY "Stylists view their own overrides"
  ON public.stylist_hours_overrides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_stylists ts
      WHERE ts.id = stylist_hours_overrides.stylist_id
        AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "Superadmin manages stylist overrides"
  ON public.stylist_hours_overrides
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE OR REPLACE TRIGGER trg_stylist_hours_overrides_updated_at
  BEFORE UPDATE ON public.stylist_hours_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
