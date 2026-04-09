-- Add fallback INSERT policy for tenant-assets that checks tenant_admins directly
CREATE POLICY "tenant_admins_upload_assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.tenant_admins
    WHERE tenant_admins.tenant_id = ((storage.foldername(name))[1])::uuid
    AND tenant_admins.user_id = auth.uid()
  )
);

-- Also add UPDATE policy for replacing files
CREATE POLICY "tenant_admins_update_assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.tenant_admins
    WHERE tenant_admins.tenant_id = ((storage.foldername(name))[1])::uuid
    AND tenant_admins.user_id = auth.uid()
  )
);