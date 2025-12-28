-- =====================================================
-- STORIES SYSTEM - Instagram-style stories for salons
-- =====================================================

CREATE TABLE public.salon_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  story_type TEXT NOT NULL DEFAULT 'work', -- 'work', 'promo', 'before_after'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  views_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.salon_stories ENABLE ROW LEVEL SECURITY;

-- Anyone can view active stories from active tenants
CREATE POLICY "Anyone can view active stories" 
ON public.salon_stories 
FOR SELECT 
USING (
  is_active = true 
  AND expires_at > now()
  AND EXISTS (
    SELECT 1 FROM tenants t 
    WHERE t.id = salon_stories.tenant_id 
    AND t.is_active = true
  )
);

-- Tenant admins can manage their stories
CREATE POLICY "Tenant admins can manage their stories" 
ON public.salon_stories 
FOR ALL 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- SuperAdmin can manage all stories
CREATE POLICY "SuperAdmin can manage all stories" 
ON public.salon_stories 
FOR ALL 
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Create indexes
CREATE INDEX idx_salon_stories_tenant_id ON public.salon_stories(tenant_id);
CREATE INDEX idx_salon_stories_expires_at ON public.salon_stories(expires_at);
CREATE INDEX idx_salon_stories_active ON public.salon_stories(is_active, expires_at);

-- =====================================================
-- STORY VIEWS - Track who viewed stories (optional)
-- =====================================================

CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.salon_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Enable RLS
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own view
CREATE POLICY "Users can record their views" 
ON public.story_views 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can see their own views
CREATE POLICY "Users can view their own views" 
ON public.story_views 
FOR SELECT 
USING (auth.uid() = user_id);

-- Tenant admins can see views on their stories
CREATE POLICY "Tenant admins can view story analytics" 
ON public.story_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM salon_stories s 
    WHERE s.id = story_views.story_id 
    AND s.tenant_id = get_user_tenant_id()
  )
);

CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_story_views_user_id ON public.story_views(user_id);