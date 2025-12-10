-- Add column to track bookings created without availability check
ALTER TABLE public.bookings 
ADD COLUMN skip_availability_check boolean NOT NULL DEFAULT false;