-- 1. story_widget_responses: no public read
DROP POLICY IF EXISTS "Users can view all responses" ON public.story_widget_responses;
CREATE POLICY "Users view own widget responses"
ON public.story_widget_responses FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.story_widgets sw
    JOIN public.salon_stories ss ON ss.id = sw.story_id
    JOIN public.tenant_admins ta ON ta.tenant_id = ss.tenant_id
    WHERE sw.id = story_widget_responses.widget_id AND ta.user_id = auth.uid()
  )
);

-- 2. story_widgets: only for active, non-expired stories of active tenants
DROP POLICY IF EXISTS "Anyone can view story widgets" ON public.story_widgets;
CREATE POLICY "Anyone can view widgets of active stories"
ON public.story_widgets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.salon_stories ss
    WHERE ss.id = story_widgets.story_id
      AND ss.is_active = true
      AND ss.expires_at > now()
      AND public.is_tenant_active(ss.tenant_id)
  )
);

-- 3. follows: own rows only (public counts use get_follower_count)
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Users view own follows"
ON public.follows FOR SELECT TO authenticated
USING (auth.uid() = follower_id);

-- 4. post_likes: own rows only (counts are denormalised on posts)
DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
CREATE POLICY "Users view own likes"
ON public.post_likes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 5. tenant_hours_overrides: only active tenants
DROP POLICY IF EXISTS "Anyone can view tenant hours overrides" ON public.tenant_hours_overrides;
CREATE POLICY "Anyone can view hours overrides of active tenants"
ON public.tenant_hours_overrides FOR SELECT
USING (public.is_tenant_active(tenant_id));

-- 6. Generic rate limiting store (server-side only)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket text NOT NULL,
  identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can read rate limits"
ON public.rate_limits FOR SELECT TO authenticated
USING (public.is_superadmin());

CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx
  ON public.rate_limits (bucket, identifier, created_at DESC);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _bucket text,
  _identifier text,
  _max_requests integer,
  _window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  DELETE FROM public.rate_limits
  WHERE created_at < now() - interval '1 day';

  SELECT count(*) INTO _count
  FROM public.rate_limits
  WHERE bucket = _bucket
    AND identifier = _identifier
    AND created_at > now() - make_interval(secs => _window_seconds);

  IF _count >= _max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (bucket, identifier) VALUES (_bucket, _identifier);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;