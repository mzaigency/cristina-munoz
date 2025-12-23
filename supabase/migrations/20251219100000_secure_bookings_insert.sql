-- Remove public insert access to bookings to prevent spam and ensure validations via edge function
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
