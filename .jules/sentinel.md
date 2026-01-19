# Sentinel's Journal

## 2025-10-25 - Fix IDOR and Privilege Escalation in create-booking
**Vulnerability:** `create-booking` edge function blindly trusted `user_id` and `skipAvailabilityCheck` parameters without verifying the caller's identity or permissions.
**Learning:** Supabase Edge Functions initialized with `SERVICE_ROLE_KEY` bypass RLS, shifting the responsibility of authorization entirely to the application logic. Input validation (Zod) is not authorization.
**Prevention:** Always verify `Authorization` header in Edge Functions and validate that the authenticated user has permission to perform the requested action (resource ownership or role check).
