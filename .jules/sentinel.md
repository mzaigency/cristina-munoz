# Sentinel Journal - Security Learnings

This journal records critical security learnings specific to this codebase.

## 2025-02-25 - Edge Function Authentication Pattern
**Vulnerability:** Supabase Edge Functions using `SUPABASE_SERVICE_ROLE_KEY` bypass Row Level Security (RLS) and often lack manual authentication verification.
**Learning:** Functions that accept `user_id` or sensitive flags in the body must manually verify the `Authorization` header using `getUser()` with the user's token, not just rely on the service client.
**Prevention:** Always instantiate a user-scoped Supabase client (using `SUPABASE_ANON_KEY` + `Authorization` header) to verify identity before performing privileged actions on behalf of a user.
