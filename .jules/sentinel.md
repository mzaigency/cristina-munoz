## 2025-02-18 - Supabase Edge Function Auth Bypass
**Vulnerability:** Edge functions using `SUPABASE_SERVICE_ROLE_KEY` bypass RLS and auth checks by default. The `create-booking` function trusted `user_id` from the body without verification.
**Learning:** Initializing `createClient` with the service role key grants superadmin access. Auth checks must be manually implemented using `supabase.auth.getUser(token)` and explicit role checks.
**Prevention:** Always verify the `Authorization` header in Edge Functions and validate that the requested `user_id` matches the authenticated user or that the user has elevated privileges.
