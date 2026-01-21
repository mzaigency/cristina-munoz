## 2025-02-18 - IDOR in Edge Functions
**Vulnerability:** `create-booking` function allowed arbitrary `user_id` injection because it used `SUPABASE_SERVICE_ROLE_KEY` without verifying the `Authorization` header against the input `user_id`.
**Learning:** Supabase Edge Functions initialized with Service Role Key completely bypass RLS. Authorization checks must be manually implemented by verifying the JWT and comparing `sub` claim against request parameters.
**Prevention:** Always extract `user` from `supabase.auth.getUser(token)` and validate that `user.id === input_user_id` unless the user has explicit administrative privileges.
