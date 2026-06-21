DROP POLICY IF EXISTS "tenant_admins_upload_assets" ON storage.objects;
DROP POLICY IF EXISTS "tenant_admins_update_assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant staff can upload their assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant staff can update their assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant staff can delete their assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar to tenant-assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar in tenant-assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar in tenant-assets" ON storage.objects;

CREATE POLICY "Tenant admins can upload tenant assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1
    FROM public.tenant_admins ta
    WHERE ta.user_id = auth.uid()
      AND ta.tenant_id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "Tenant admins can update tenant assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1
    FROM public.tenant_admins ta
    WHERE ta.user_id = auth.uid()
      AND ta.tenant_id = ((storage.foldername(name))[1])::uuid
  )
)
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1
    FROM public.tenant_admins ta
    WHERE ta.user_id = auth.uid()
      AND ta.tenant_id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "Tenant admins can delete tenant assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1
    FROM public.tenant_admins ta
    WHERE ta.user_id = auth.uid()
      AND ta.tenant_id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "Users can upload own avatar to tenant-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar in tenant-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar in tenant-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);