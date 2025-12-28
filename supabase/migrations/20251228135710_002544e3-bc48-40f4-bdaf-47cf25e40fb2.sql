-- =====================================================
-- FAVORITES SYSTEM
-- Allows users to save their favorite salons
-- =====================================================

CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites" 
ON public.favorites 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own favorites
CREATE POLICY "Users can create their own favorites" 
ON public.favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites" 
ON public.favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_tenant_id ON public.favorites(tenant_id);

-- =====================================================
-- Add hero_images array to tenants for gallery
-- =====================================================
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS hero_images JSONB DEFAULT '[]'::jsonb;

-- =====================================================
-- Add average_price to tenants for "desde X€" display
-- =====================================================
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS average_price DECIMAL(10,2) DEFAULT NULL;