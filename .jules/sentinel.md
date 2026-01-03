## 2025-02-25 - IDOR in create-booking Edge Function
**Vulnerability:** The `create-booking` function accepted a `user_id` in the request body and used it to fetch the user's profile and create a booking linked to that user without verifying if the authenticated user (JWT) matched the `user_id` or had admin privileges.
**Learning:** Documentation/Memory stated that strict authorization was enforced, but the actual implementation completely lacked this check. Trust code, not docs.
**Prevention:** Always verify that `user_id` from request body matches `auth.uid()` from the JWT, unless the user has an explicitly verified admin role.
