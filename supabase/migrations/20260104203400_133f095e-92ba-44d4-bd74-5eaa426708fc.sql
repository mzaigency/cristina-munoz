-- Sistema de Seguidores
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, tenant_id)
);

-- Indices para rendimiento
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_tenant ON public.follows(tenant_id);

-- Sistema de Publicaciones (Posts)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID,
  image_url TEXT NOT NULL,
  caption TEXT,
  category TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_tenant ON public.posts(tenant_id);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX idx_posts_active ON public.posts(is_active) WHERE is_active = TRUE;

-- Likes en publicaciones
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user ON public.post_likes(user_id);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para follows
CREATE POLICY "Anyone can view follows"
ON public.follows FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can follow"
ON public.follows FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- RLS Policies para posts
CREATE POLICY "Anyone can view active posts"
ON public.posts FOR SELECT
USING (is_active = true);

CREATE POLICY "Tenant admins can create posts"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenant_admins
    WHERE tenant_admins.tenant_id = posts.tenant_id
    AND tenant_admins.user_id = auth.uid()
  )
);

CREATE POLICY "Tenant admins can update posts"
ON public.posts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_admins
    WHERE tenant_admins.tenant_id = posts.tenant_id
    AND tenant_admins.user_id = auth.uid()
  )
);

CREATE POLICY "Tenant admins can delete posts"
ON public.posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_admins
    WHERE tenant_admins.tenant_id = posts.tenant_id
    AND tenant_admins.user_id = auth.uid()
  )
);

-- RLS Policies para post_likes
CREATE POLICY "Anyone can view likes"
ON public.post_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like"
ON public.post_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
ON public.post_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para actualizar likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_post_like_change
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Trigger para updated_at en posts
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_tenant_updated_at();

-- Habilitar realtime para follows
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- Función para obtener posts de seguidos
CREATE OR REPLACE FUNCTION public.get_following_posts(_user_id UUID, _limit INTEGER DEFAULT 20, _offset INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  tenant_name TEXT,
  tenant_slug TEXT,
  tenant_logo TEXT,
  image_url TEXT,
  caption TEXT,
  category TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMPTZ,
  is_liked BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.tenant_id,
    t.name AS tenant_name,
    t.slug AS tenant_slug,
    t.logo_url AS tenant_logo,
    p.image_url,
    p.caption,
    p.category,
    p.likes_count,
    p.comments_count,
    p.created_at,
    EXISTS (SELECT 1 FROM public.post_likes pl WHERE pl.post_id = p.id AND pl.user_id = _user_id) AS is_liked
  FROM public.posts p
  INNER JOIN public.follows f ON f.tenant_id = p.tenant_id AND f.follower_id = _user_id
  INNER JOIN public.tenants t ON t.id = p.tenant_id
  WHERE p.is_active = true
  ORDER BY p.created_at DESC
  LIMIT _limit
  OFFSET _offset
$$;

-- Función para obtener contador de seguidores
CREATE OR REPLACE FUNCTION public.get_follower_count(_tenant_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.follows WHERE tenant_id = _tenant_id
$$;