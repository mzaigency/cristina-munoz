# Sentinel's Journal

## 2025-02-18 - IDOR in Edge Functions
**Vulnerability:** Insecure Direct Object Reference (IDOR) in `create-booking` function.
**Learning:** The function used a service role client to fetch user profiles based on a user-provided `user_id` without verifying if the caller was that user. This allowed unauthorized users to create bookings for others and potentially leak PII (phone number) in the response.
**Prevention:** Always verify the JWT (`Authorization` header) matches the `user_id` being operated on, especially when using `SUPABASE_SERVICE_ROLE_KEY`. Verify roles for privileged operations like skipping availability checks.
