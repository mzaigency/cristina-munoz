## 2025-02-18 - Fix auth bypass in create-booking
**Vulnerability:** IDOR and Privilege Escalation in `create-booking` edge function. Users could bypass availability checks and create bookings for others by manipulating `skipAvailabilityCheck` and `user_id` parameters.
**Learning:** Supabase Edge Functions initialized with `SERVICE_ROLE_KEY` bypass RLS, making manual authorization checks mandatory for every sensitive action. Implicit trust in payload parameters is a critical failure pattern in serverless functions.
**Prevention:** Always validate `Authorization` header and perform explicit role checks (`checkIsStaff`) before allowing privileged operations in Edge Functions.
