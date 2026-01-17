# Sentinel's Journal

## 2024-05-23 - Authorization Bypass in Edge Functions
**Vulnerability:** The `create-booking` function accepted a `user_id` and `skipAvailabilityCheck` parameter from the client without verifying if the caller was actually authorized to use them. This allowed:
1. IDOR: Users could create bookings assigned to other users.
2. Logic Bypass: Users could skip availability checks by setting a flag.
**Learning:** Using `SUPABASE_SERVICE_ROLE_KEY` to initialize the client bypasses RLS, which is necessary for the function's operation but removes the default security layer. Explicit authorization checks must be implemented manually in the function logic using `supabase.auth.getUser()`.
**Prevention:** Always verify the authenticated user's identity and roles before trusting sensitive input parameters like `user_id` or override flags. Use `getUser(token)` to validate the JWT even when using the service role client for database operations.
