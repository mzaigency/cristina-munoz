## 2024-05-23 - IDOR Prevention in Edge Functions

**Vulnerability:** The `create-booking` Edge Function was trusting the `user_id` provided in the request body without verifying it against the authenticated user's JWT. This allowed any user to create bookings on behalf of any other user (IDOR).
**Learning:** Supabase Edge Functions initialized with `service_role` key bypass RLS. Authentication and Authorization must be manually implemented by validating the JWT and checking permissions explicitly.
**Prevention:** Always extract the `Authorization` header, validate the user via `supabase.auth.getUser()`, and compare the authenticated user ID with the target resource ID. For privileged actions, query the `user_roles` table explicitly.
