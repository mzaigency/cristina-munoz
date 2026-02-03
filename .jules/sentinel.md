## 2024-05-22 - Supabase Edge Function IDOR Prevention
**Vulnerability:** The `create-booking` function allowed any authenticated user (or guest) to create bookings for *any* other user ID without verification, leading to IDOR and potential data leakage/spam. It also allowed bypassing availability checks.
**Learning:** Supabase Edge Functions do not automatically enforce RLS or user context when using the service role key. The `Authorization` header must be explicitly used to initialize a user-scoped client (`supabase.auth.getUser()`) to verify identity.
**Prevention:** Always verify that `req.headers.get('Authorization')` belongs to the `user_id` being acted upon, or check for specific staff privileges before allowing actions on behalf of others.
