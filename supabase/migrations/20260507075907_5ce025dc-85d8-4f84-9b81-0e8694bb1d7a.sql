CREATE OR REPLACE FUNCTION public.get_tenant_feed_section_metrics(p_tenant_id uuid, days integer DEFAULT 30)
RETURNS TABLE(section_id text, impressions bigint, clicks bigint, conversions bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.is_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_admins ta
      WHERE ta.tenant_id = p_tenant_id AND ta.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    fe.section_id,
    COUNT(*) FILTER (WHERE fe.event_type = 'impression')::bigint AS impressions,
    COUNT(*) FILTER (WHERE fe.event_type = 'click')::bigint AS clicks,
    COUNT(*) FILTER (WHERE fe.event_type = 'conversion')::bigint AS conversions
  FROM public.feed_events fe
  WHERE fe.tenant_id = p_tenant_id
    AND fe.created_at >= now() - make_interval(days => days)
  GROUP BY fe.section_id
  ORDER BY impressions DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_feed_daily_metrics(p_tenant_id uuid, days integer DEFAULT 30)
RETURNS TABLE(day date, impressions bigint, clicks bigint, conversions bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.is_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_admins ta
      WHERE ta.tenant_id = p_tenant_id AND ta.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    (fe.created_at AT TIME ZONE 'UTC')::date AS day,
    COUNT(*) FILTER (WHERE fe.event_type = 'impression')::bigint,
    COUNT(*) FILTER (WHERE fe.event_type = 'click')::bigint,
    COUNT(*) FILTER (WHERE fe.event_type = 'conversion')::bigint
  FROM public.feed_events fe
  WHERE fe.tenant_id = p_tenant_id
    AND fe.created_at >= now() - make_interval(days => days)
  GROUP BY 1
  ORDER BY 1;
END;
$$;