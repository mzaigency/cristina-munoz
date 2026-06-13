# Sentinel Journal

## 2024-05-22 - [Broken Authentication in Edge Functions]
**Vulnerability:** Found `create-booking` Edge Function initializing Supabase with `SERVICE_ROLE_KEY` but failing to manually verify the JWT from `Authorization` header. This allowed any user (including guests) to:
1. Impersonate any user by sending `user_id` in the body (IDOR).
2. Bypass business logic (availability checks) by sending `skipAvailabilityCheck: true` (Privilege Escalation).

**Learning:** When using `SERVICE_ROLE_KEY` in Supabase Edge Functions (often needed for admin tasks), RLS is bypassed. The standard `req.headers.get('Authorization')` is not automatically checked by Supabase client unless initialized with the user's token. However, initializing with user token might prevent admin actions.

**Prevention:**
1. Always manually verify the JWT using `supabase.auth.getUser(token)` if using Service Role Key.
2. Explicitly validate sensitive parameters (`user_id`, `skip_checks`) against the authenticated user's identity and roles.
3. Use a "deny by default" approach for sensitive flags.
