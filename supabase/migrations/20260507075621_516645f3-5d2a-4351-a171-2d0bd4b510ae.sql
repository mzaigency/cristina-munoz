
CREATE OR REPLACE FUNCTION public.get_feed_section_metrics(days integer DEFAULT 30)
RETURNS TABLE (
  section_id text,
  impressions bigint,
  clicks bigint,
  conversions bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    section_id,
    COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
    COUNT(*) FILTER (WHERE event_type = 'click') AS clicks,
    COUNT(*) FILTER (WHERE event_type = 'conversion') AS conversions
  FROM public.feed_events
  WHERE created_at >= now() - make_interval(days => GREATEST(days, 1))
    AND public.is_superadmin()
  GROUP BY section_id
  ORDER BY impressions DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_feed_tenant_metrics(days integer DEFAULT 30, limit_count integer DEFAULT 50)
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  section_id text,
  impressions bigint,
  clicks bigint,
  conversions bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fe.tenant_id,
    t.name AS tenant_name,
    fe.section_id,
    COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
    COUNT(*) FILTER (WHERE event_type = 'click') AS clicks,
    COUNT(*) FILTER (WHERE event_type = 'conversion') AS conversions
  FROM public.feed_events fe
  LEFT JOIN public.tenants t ON t.id = fe.tenant_id
  WHERE fe.created_at >= now() - make_interval(days => GREATEST(days, 1))
    AND fe.tenant_id IS NOT NULL
    AND public.is_superadmin()
  GROUP BY fe.tenant_id, t.name, fe.section_id
  ORDER BY impressions DESC
  LIMIT GREATEST(limit_count, 1);
$$;

REVOKE EXECUTE ON FUNCTION public.get_feed_section_metrics(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_feed_tenant_metrics(integer, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_feed_section_metrics(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_feed_tenant_metrics(integer, integer) TO authenticated;
