## 2025-05-23 - Edge Function Authorization Bypass
**Vulnerability:** Found `create-booking` Edge Function initializing Supabase client with `SUPABASE_SERVICE_ROLE_KEY` but failing to manually verify the user's identity or permissions for sensitive parameters (`skipAvailabilityCheck`, `user_id`).
**Learning:** Edge Functions run outside RLS when using the Service Role Key. If `getUser(token)` is not called and checked, any user can impersonate others or bypass logic intended for admins.
**Prevention:** Always extract the JWT from the `Authorization` header and use `supabase.auth.getUser(token)` to establish identity. Explicitly check permissions before trusting sensitive input parameters.
