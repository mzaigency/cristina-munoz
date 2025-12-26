## 2025-10-27 - IDOR in Edge Functions
**Vulnerability:** Broken Object Level Authorization (IDOR) in `create-booking` function.
**Learning:** Supabase Edge Functions often use the Service Role key (`SUPABASE_SERVICE_ROLE_KEY`) for database operations to bypass RLS for complex logic. However, this bypasses the automatic user authentication context.
**Prevention:** Always manually verify the user's identity using `supabase.auth.getUser(token)` from the `Authorization` header when using a Service Role client, especially if the function accepts a `user_id` or similar identifier from the client. Validate that the authenticated user matches the requested resource owner or has admin privileges.
