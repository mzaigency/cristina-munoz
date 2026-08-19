DO $$
DECLARE
  r record;
  policy_helpers text[] := ARRAY[
    'get_user_tenant_id','has_role','is_superadmin','is_tenant_active',
    'user_belongs_to_tenant'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY(policy_helpers)
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', r.sig);
  END LOOP;
END $$;