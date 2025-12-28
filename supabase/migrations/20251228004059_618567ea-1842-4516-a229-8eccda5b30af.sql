-- Create storage bucket for tenant assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tenant-assets', 'tenant-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tenant assets
CREATE POLICY "Anyone can view tenant assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-assets');

CREATE POLICY "Authenticated users can upload tenant assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Tenant admins can update their assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tenant-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Tenant admins can delete their assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tenant-assets' 
  AND auth.role() = 'authenticated'
);

-- Add hero_image_url to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS hero_image_url TEXT DEFAULT NULL;

-- Create table for service category images per tenant
CREATE TABLE IF NOT EXISTS public.tenant_category_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, category)
);

-- Enable RLS on tenant_category_images
ALTER TABLE public.tenant_category_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant_category_images
CREATE POLICY "Anyone can view tenant category images"
ON public.tenant_category_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenants t 
    WHERE t.id = tenant_category_images.tenant_id 
    AND t.is_active = true
  )
);

CREATE POLICY "SuperAdmin can manage all category images"
ON public.tenant_category_images FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Tenant admins can manage their category images"
ON public.tenant_category_images FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());