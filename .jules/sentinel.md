# Sentinel's Journal

## 2025-02-24 - Broken Object Level Authorization in Edge Functions
**Vulnerability:** The `create-booking` Edge Function allowed any user to create bookings for any other user by simply providing a target `user_id` in the request body, as it used the Service Role key to bypass RLS without verifying the requestor's identity.
**Learning:** Supabase Edge Functions initialized with `SERVICE_ROLE_KEY` do not automatically respect RLS or validate that the operation is authorized for the calling user. Explicit JWT verification and role checking is required.
**Prevention:** Always verify the `Authorization` header using `supabase.auth.getUser()` in Edge Functions. If `user_id` is provided in the body, verify it matches `auth.user.id` or that the user has an administrative role.
