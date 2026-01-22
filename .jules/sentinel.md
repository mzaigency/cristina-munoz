## 2025-02-25 - IDOR in Supabase Edge Functions
**Vulnerability:** Insecure Direct Object Reference (IDOR) and Privilege Escalation in `create-booking` function.
**Learning:** Supabase Edge Functions initialized with `SUPABASE_SERVICE_ROLE_KEY` bypass RLS. Without manual verification of the `Authorization` header against the request body (e.g., `user_id`), any user can act as any other user.
**Prevention:** Always parse the JWT using `supabase.auth.getUser(token)` and verify that `request.user_id` matches `auth.user.id` or that the authenticated user has explicit staff privileges before processing the request.
