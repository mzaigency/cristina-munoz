
-- FIX 1: password_reset_tokens DELETE policy
DROP POLICY IF EXISTS "System can delete password reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Service role can delete tokens"
  ON public.password_reset_tokens FOR DELETE
  TO service_role
  USING (true);

-- FIX 2a: Storage - tenant-assets isolation
DROP POLICY IF EXISTS "Authenticated users can upload tenant assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can delete their assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can update their assets" ON storage.objects;

CREATE POLICY "Tenant staff can upload their assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = (public.get_user_tenant_id())::text
  );
CREATE POLICY "Tenant staff can update their assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = (public.get_user_tenant_id())::text
  );
CREATE POLICY "Tenant staff can delete their assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = (public.get_user_tenant_id())::text
  );

-- FIX 2b: Storage - story-images isolation
DROP POLICY IF EXISTS "Authenticated users can upload story images to their tenant fol" ON storage.objects;
DROP POLICY IF EXISTS "Tenant staff can delete their story images" ON storage.objects;

CREATE POLICY "Tenant staff can upload story images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'story-images'
    AND (storage.foldername(name))[1] = (public.get_user_tenant_id())::text
  );
CREATE POLICY "Tenant staff can delete story images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'story-images'
    AND (storage.foldername(name))[1] = (public.get_user_tenant_id())::text
  );

-- FIX 2c: Storage - story-videos isolation
DROP POLICY IF EXISTS "Authenticated users can upload story videos" ON storage.objects;
CREATE POLICY "Tenant staff can upload story videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'story-videos'
    AND (storage.foldername(name))[1] = (public.get_user_tenant_id())::text
  );

-- FIX 3: user_roles privilege escalation
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can insert tenant-scoped roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role, NULL::uuid)
    AND role IN ('admin'::app_role, 'stylist'::app_role)
    AND tenant_id IS NOT NULL
    AND tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Admins can update tenant-scoped roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role, NULL::uuid)
    AND role <> 'superadmin'::app_role
    AND tenant_id IS NOT NULL
    AND tenant_id = public.get_user_tenant_id()
  )
  WITH CHECK (
    role IN ('admin'::app_role, 'stylist'::app_role)
    AND tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Admins can delete tenant-scoped roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role, NULL::uuid)
    AND role <> 'superadmin'::app_role
    AND tenant_id IS NOT NULL
    AND tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "SuperAdmin can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- FIX 4: profiles cross-tenant read
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view tenant user profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role, NULL::uuid)
    AND (
      EXISTS (SELECT 1 FROM public.tenant_admins ta WHERE ta.user_id = profiles.id AND ta.tenant_id = public.get_user_tenant_id())
      OR EXISTS (SELECT 1 FROM public.tenant_stylists ts WHERE ts.user_id = profiles.id AND ts.tenant_id = public.get_user_tenant_id())
      OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.user_id = profiles.id AND b.tenant_id = public.get_user_tenant_id())
      OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.user_id = profiles.id AND c.tenant_id = public.get_user_tenant_id())
    )
  );

CREATE POLICY "SuperAdmin can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_superadmin());
