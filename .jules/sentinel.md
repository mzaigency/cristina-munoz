## 2025-02-04 - IDOR in Edge Functions
**Vulnerability:** The `create-booking` edge function trusted the `user_id` provided in the request body without verifying the authenticated user's identity.
**Learning:** Supabase Edge Functions initialized with the service role key bypass RLS. Authentication must be manually verified using `supabase.auth.getUser()` with the incoming `Authorization` header.
**Prevention:** Always verify the user identity from the JWT before performing sensitive actions or using user-provided IDs.
