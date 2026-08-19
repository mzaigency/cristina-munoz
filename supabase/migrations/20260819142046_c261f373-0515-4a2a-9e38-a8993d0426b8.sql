-- Fix mutable search_path on email queue helpers
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;

-- Revoke EXECUTE from anon/authenticated on every SECURITY DEFINER function
-- in public, except the ones the app legitimately calls from the client.
DO $$
DECLARE
  r record;
  allowlist text[] := ARRAY[
    'has_role','is_superadmin','is_tenant_active','user_belongs_to_tenant',
    'get_user_tenant_id','get_public_tenants','get_public_tenant_by_id',
    'get_public_tenant_by_slug','get_tenant_by_slug','get_tenant_reviews',
    'get_follower_count','get_following_posts','get_my_bookings',
    'search_my_bookings','get_notification_preferences','can_create_review',
    'check_availability','get_tenant_feed_daily_metrics',
    'get_tenant_feed_section_metrics','get_feed_section_metrics',
    'get_feed_tenant_metrics'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prorettype <> 'trigger'::regtype
      AND NOT (p.proname = ANY(allowlist))
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;

  -- Trigger functions never need direct EXECUTE by clients
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prorettype = 'trigger'::regtype
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;