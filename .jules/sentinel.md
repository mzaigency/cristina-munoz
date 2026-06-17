## 2025-02-12 - Supabase Edge Function IDOR
**Vulnerability:** IDOR in `create-booking` function where any `user_id` could be supplied without verification.
**Learning:** Supabase Edge Functions using `SUPABASE_SERVICE_ROLE_KEY` bypass RLS. Authentication must be manually verified using `supabase.auth.getUser(token)` when handling sensitive user-scoped operations.
**Prevention:** Always verify that the authenticated user matches the target `user_id` in request bodies, or ensure the caller has administrative privileges.
