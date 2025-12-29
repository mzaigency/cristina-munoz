-- Root fix: public policies were checking tenants table (blocked by tenants RLS).
-- Create SECURITY DEFINER helper to check if a tenant is active without requiring SELECT on tenants.

CREATE OR REPLACE FUNCTION public.is_tenant_active(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = _tenant_id
      AND t.is_active = true
  );
$$;

-- Update public read policies for booking-related tables

-- services
DROP POLICY IF EXISTS "Public can view active tenant services" ON public.services;
CREATE POLICY "Public can view active tenant services"
ON public.services
FOR SELECT
TO anon, authenticated
USING (
  tenant_id IS NOT NULL
  AND public.is_tenant_active(tenant_id)
);

-- tenant_stylists
DROP POLICY IF EXISTS "Anyone can view active tenant stylists" ON public.tenant_stylists;
CREATE POLICY "Anyone can view active tenant stylists"
ON public.tenant_stylists
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND public.is_tenant_active(tenant_id)
);

-- tenant_business_hours
DROP POLICY IF EXISTS "Anyone can view active tenant business hours" ON public.tenant_business_hours;
CREATE POLICY "Anyone can view active tenant business hours"
ON public.tenant_business_hours
FOR SELECT
TO anon, authenticated
USING (
  public.is_tenant_active(tenant_id)
);

-- Optional: keep other public-facing tables consistent
-- tenant_category_images
DROP POLICY IF EXISTS "Anyone can view tenant category images" ON public.tenant_category_images;
CREATE POLICY "Anyone can view tenant category images"
ON public.tenant_category_images
FOR SELECT
TO anon, authenticated
USING (
  public.is_tenant_active(tenant_id)
);

-- salon_stories
DROP POLICY IF EXISTS "Anyone can view active stories" ON public.salon_stories;
CREATE POLICY "Anyone can view active stories"
ON public.salon_stories
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND expires_at > now()
  AND public.is_tenant_active(tenant_id)
);
