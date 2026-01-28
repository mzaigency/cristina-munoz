# Sentinel's Journal

## 2024-05-22 - Missing Authorization in Edge Functions
**Vulnerability:** The `create-booking` Supabase Edge Function initialized the Supabase client with the Service Role Key but failed to verify the user's identity or authorization before performing actions on their behalf.
**Learning:** Initializing a client with `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS). When doing so, you MUST manually verify the `Authorization` header and implement your own permission checks.
**Prevention:** Always use `supabase.auth.getUser()` to verify the token. Prefer creating a client with the user's token (scoped client) when possible, or explicitly check permissions before using a service role client.
