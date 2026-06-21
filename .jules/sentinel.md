# Sentinel Journal

## 2024-05-23 - Missing Authentication in Edge Functions
**Vulnerability:** The `create-booking` edge function allowed anyone to create bookings for any user by providing a `user_id`, with no authentication check.
**Learning:** Supabase Edge Functions do not automatically enforce RLS or validate the `Authorization` header when using the service role client.
**Prevention:** Always manually verify the JWT in Edge Functions using `supabase.auth.getUser()` before performing sensitive actions, especially when using the service role client.
