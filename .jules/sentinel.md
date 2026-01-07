## 2024-05-23 - IDOR in Edge Functions
**Vulnerability:** The `create-booking` function allowed creating bookings for any user by providing `user_id` without verifying the caller's identity or authorization.
**Learning:** Supabase Edge Functions using the Service Role Key bypass RLS, so manual authentication checks using `supabase.auth.getUser(token)` are mandatory for any operation involving user data.
**Prevention:** Always verify `Authorization` header and match `user.id` against input parameters when using privileged clients.
