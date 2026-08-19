DO $$
DECLARE
  r record;
  auth_only text[] := ARRAY[
    'get_my_bookings','search_my_bookings','get_notification_preferences',
    'can_create_review','get_following_posts','get_user_tenant_id','has_role',
    'is_superadmin','user_belongs_to_tenant','get_feed_section_metrics',
    'get_feed_tenant_metrics','get_tenant_feed_daily_metrics',
    'get_tenant_feed_section_metrics'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY(auth_only)
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;