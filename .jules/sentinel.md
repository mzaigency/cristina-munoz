# Sentinel Journal 🛡️

## 2025-02-06 - Edge Function Authorization Gaps
**Vulnerability:** Supabase Edge Functions (like `create-booking`) initialized with `SUPABASE_SERVICE_ROLE_KEY` operate with full admin privileges and do not automatically enforce Row Level Security (RLS) or validate the invoking user's identity.
**Learning:** The default pattern `serve(async (req) => { ... })` does not parse the `Authorization` header. Developers must manually extract the token, create a scoped client (or use `getUser(token)`), and explicitly validate that the caller is authorized to perform the action (e.g., verifying `user_id` matches the caller).
**Prevention:** Always verify the `Authorization` header at the start of any sensitive Edge Function. Use `getUser()` to identify the caller and perform explicit role/ownership checks before trusting input parameters like `user_id`.
