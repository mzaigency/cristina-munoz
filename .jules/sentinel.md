# Sentinel Journal

## 2024-05-23 - Missing Authorization in Edge Functions
**Vulnerability:** The `create-booking` function allowed arbitrary `user_id` assignment and `skipAvailabilityCheck` usage without verifying the caller's identity or permissions.
**Learning:** Using `SUPABASE_SERVICE_ROLE_KEY` in edge functions is powerful but dangerous because it bypasses RLS. You must manually implement authorization checks (auth.getUser(), role verification) before performing sensitive actions or accepting restricted parameters.
**Prevention:** Always verify `Authorization` header in Edge Functions. If accepting `user_id` or admin flags, explicitly validate that the authenticated user owns that ID or has staff privileges.
