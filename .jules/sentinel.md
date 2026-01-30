# Sentinel Journal

## 2025-05-23 - Edge Function Auth Bypass
**Vulnerability:** Supabase Edge Functions initialized with `SUPABASE_SERVICE_ROLE_KEY` bypass RLS, allowing unauthorized users to execute privileged actions (e.g., `skipAvailabilityCheck`) or impersonate others (`user_id`).
**Learning:** `create-booking` trusted input parameters without verifying the caller's identity via the `Authorization` header.
**Prevention:** Always verify the JWT token using `supabase.auth.getUser()` and implement manual permission checks against `tenant_admins` or `tenant_stylists` before trusting sensitive inputs.
