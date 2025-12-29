-- 1. Add sort_order to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 2. Add sort_order to tenant_category_images for category ordering
ALTER TABLE public.tenant_category_images ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 3. Create stylist_business_hours table for individual stylist schedules
CREATE TABLE IF NOT EXISTS public.stylist_business_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stylist_id uuid NOT NULL REFERENCES public.tenant_stylists(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_working boolean DEFAULT true,
  start_time time without time zone,
  end_time time without time zone,
  break_start time without time zone,
  break_end time without time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(stylist_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.stylist_business_hours ENABLE ROW LEVEL SECURITY;

-- RLS policies for stylist_business_hours
CREATE POLICY "Anyone can view active tenant stylist hours"
  ON public.stylist_business_hours
  FOR SELECT
  USING (is_tenant_active(tenant_id));

CREATE POLICY "Tenant admins can manage their stylist hours"
  ON public.stylist_business_hours
  FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "SuperAdmin can manage all stylist hours"
  ON public.stylist_business_hours
  FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());