## 2024-05-23 - [Critical] Auth Bypass in Edge Functions
**Vulnerability:** The `create-booking` function trusted the `user_id` provided in the request body without verifying it against the `Authorization` header token. This allowed any user to create bookings for any other user (IDOR).
**Learning:** Supabase Edge Functions do not automatically enforce RLS or auth checks when initialized with `SUPABASE_SERVICE_ROLE_KEY`. Explicit verification of the JWT token using `supabase.auth.getUser()` is required.
**Prevention:** Always verify `req.headers.get('Authorization')` and match `user.id` against request parameters in sensitive functions. Use `maybeSingle()` for safe role lookups.
