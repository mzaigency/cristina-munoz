
CREATE TABLE public.tenant_hours_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  open_time TIME,
  close_time TIME,
  break_start TIME,
  break_end TIME,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenant_hours_overrides_tenant_date
  ON public.tenant_hours_overrides (tenant_id, date_from, date_to);

ALTER TABLE public.tenant_hours_overrides ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.validate_tenant_hours_override()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.date_to < NEW.date_from THEN
    RAISE EXCEPTION 'date_to must be >= date_from';
  END IF;
  IF NEW.is_closed = false AND (NEW.open_time IS NULL OR NEW.close_time IS NULL) THEN
    RAISE EXCEPTION 'open_time and close_time are required when not closed';
  END IF;
  IF NEW.is_closed = false AND NEW.close_time <= NEW.open_time THEN
    RAISE EXCEPTION 'close_time must be after open_time';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_tenant_hours_override
BEFORE INSERT OR UPDATE ON public.tenant_hours_overrides
FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_hours_override();

CREATE TRIGGER trg_tenant_hours_overrides_updated_at
BEFORE UPDATE ON public.tenant_hours_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone can view tenant hours overrides"
ON public.tenant_hours_overrides
FOR SELECT
USING (true);

CREATE POLICY "Tenant admins can manage their hours overrides"
ON public.tenant_hours_overrides
FOR ALL
USING (
  (tenant_id = public.get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, NULL::uuid))
  OR public.is_superadmin()
)
WITH CHECK (
  (tenant_id = public.get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, NULL::uuid))
  OR public.is_superadmin()
);
