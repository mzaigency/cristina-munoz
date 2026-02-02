# Sentinel Journal 🛡️

## 2024-05-23 - [Supabase Edge Function Auth Bypass]
**Vulnerability:** Found `create-booking` function using `SUPABASE_SERVICE_ROLE_KEY` without verifying the user's identity via `supabase.auth.getUser()`, allowing IDOR/Impersonation.
**Learning:** Edge Functions using Service Role keys bypass RLS. Explicit auth verification is mandatory for any function handling user-specific data or actions.
**Prevention:** Always parse `Authorization` header and validate the JWT using `supabase.auth.getUser()` before trusting any `user_id` input.
