# Sentinel Journal

## 2025-02-19 - IDOR in Edge Functions using Service Role Key
**Vulnerability:** `create-booking` function used `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS but failed to verify if the `user_id` in the request body matched the authenticated user.
**Learning:** Edge Functions run with high privileges. Unlike RLS-protected database queries, logic in Edge Functions must manually verify `Authorization` header and enforce ownership or permissions.
**Prevention:** Always extract `user` from `Authorization` header using a client with `SUPABASE_ANON_KEY` and compare `user.id` against sensitive parameters in the request body.
