-- =============================================
-- FASE 4: ACTUALIZAR RLS PARA MULTI-TENANT
-- =============================================

-- 1. Actualizar políticas de services para incluir superadmin y tenant_id
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

CREATE POLICY "SuperAdmin can manage all services"
ON public.services FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Tenant admins can manage their services"
ON public.services FOR ALL
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
)
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);

CREATE POLICY "Anyone can view tenant services"
ON public.services FOR SELECT
USING (
  tenant_id IS NOT NULL 
  AND EXISTS (SELECT 1 FROM tenants t WHERE t.id = tenant_id AND t.is_active = true)
);

-- 2. Actualizar políticas de bookings
DROP POLICY IF EXISTS "Admin and stylists can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin and stylists can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin and stylists can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

CREATE POLICY "SuperAdmin can manage all bookings"
ON public.bookings FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Tenant staff can view their tenant bookings"
ON public.bookings FOR SELECT
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);

CREATE POLICY "Tenant staff can update their tenant bookings"
ON public.bookings FOR UPDATE
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
)
WITH CHECK (
  tenant_id = get_user_tenant_id()
);

CREATE POLICY "Tenant staff can delete their tenant bookings"
ON public.bookings FOR DELETE
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);

CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
ON public.bookings FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND tenant_id IS NOT NULL
);

CREATE POLICY "Users can update their own bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Actualizar políticas de reviews
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews with rate limit" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews within 24h" ON public.reviews;

CREATE POLICY "SuperAdmin can manage all reviews"
ON public.reviews FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Tenant admins can view their tenant reviews"
ON public.reviews FOR SELECT
USING (
  tenant_id = get_user_tenant_id() 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Tenant admins can delete their tenant reviews"
ON public.reviews FOR DELETE
USING (
  tenant_id = get_user_tenant_id() 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view approved reviews"
ON public.reviews FOR SELECT
USING (approved = true);

CREATE POLICY "Users can view their own reviews"
ON public.reviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create reviews with rate limit"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL 
  AND tenant_id IS NOT NULL
  AND can_create_review()
);

CREATE POLICY "Users can update their own reviews within 24h"
ON public.reviews FOR UPDATE
USING (
  auth.uid() = user_id 
  AND created_at > (now() - INTERVAL '24 hours')
)
WITH CHECK (
  auth.uid() = user_id 
  AND created_at > (now() - INTERVAL '24 hours')
);