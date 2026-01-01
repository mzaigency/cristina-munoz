## 2025-02-06 - [CRITICAL] IDOR in create-booking Edge Function
**Vulnerability:** The `create-booking` function accepted a `user_id` in the request body and used the Supabase service role key to fetch that user's profile and create a booking linked to them, without verifying if the caller was actually that user.
**Learning:** Supabase Edge Functions using the service role key bypass RLS. Unlike client-side requests, you MUST manually verify the `Authorization` header and check that the authenticated user matches the target resource owner (or has admin privileges).
**Prevention:** Always verify `req.headers.get('Authorization')` using `supabase.auth.getUser()` before performing actions on behalf of a user ID provided in the payload.
