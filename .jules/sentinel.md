## 2024-05-22 - Authorization Bypass in Service-Role Edge Functions
**Vulnerability:** `create-booking` function accepted `user_id` from request body without verifying it matched the authenticated user, while using a service-role client that bypassed RLS.
**Learning:** When using `SUPABASE_SERVICE_ROLE_KEY` in Edge Functions to perform admin-like tasks (like availability checks), explicit authorization checks are mandatory.
**Prevention:** Always verify `Authorization` header JWT using `supabase.auth.getUser()` and compare `user.id` against request parameters before performing actions on behalf of a user.
