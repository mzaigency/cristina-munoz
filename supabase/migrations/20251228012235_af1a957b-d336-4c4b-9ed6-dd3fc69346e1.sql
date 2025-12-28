-- Table for AI generation history/audit
CREATE TABLE public.tenant_ai_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL, -- 'branding', 'faq', 'seo', etc.
  prompt TEXT NOT NULL,
  output JSONB NOT NULL,
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true -- which generation is currently being used
);

-- Enable RLS
ALTER TABLE public.tenant_ai_generations ENABLE ROW LEVEL SECURITY;

-- SuperAdmin can manage all
CREATE POLICY "SuperAdmin can manage all AI generations"
ON public.tenant_ai_generations
FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Tenant admins can view their own generations
CREATE POLICY "Tenant admins can view their AI generations"
ON public.tenant_ai_generations
FOR SELECT
USING (tenant_id = get_user_tenant_id());

-- Add preview_token column to tenants for temporary preview URLs
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS preview_token TEXT UNIQUE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS preview_expires_at TIMESTAMP WITH TIME ZONE;

-- Index for fast preview token lookup
CREATE INDEX IF NOT EXISTS idx_tenants_preview_token ON public.tenants(preview_token) WHERE preview_token IS NOT NULL;