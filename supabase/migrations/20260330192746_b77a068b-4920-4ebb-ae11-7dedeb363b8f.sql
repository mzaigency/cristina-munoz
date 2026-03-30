
-- Temporalmente quitar la FK de related_booking_id
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_related_booking_id_fkey;
