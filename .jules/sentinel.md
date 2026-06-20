## 2024-05-23 - IDOR in Edge Functions
**Vulnerability:** The `create-booking` Edge Function accepted `user_id` from the request body without verifying if the caller was authorized to act on behalf of that user. It used the `service_role` key, bypassing RLS.
**Learning:** Supabase Edge Functions using `service_role` keys completely bypass RLS. Authentication must be manually verified using `supabase.auth.getUser(token)` from the `Authorization` header. Trusting input `user_id` blindly leads to IDOR.
**Prevention:** Always verify the JWT in Edge Functions. If `user_id` is an input, verify it matches `auth.user.id` or that the caller has admin privileges.
