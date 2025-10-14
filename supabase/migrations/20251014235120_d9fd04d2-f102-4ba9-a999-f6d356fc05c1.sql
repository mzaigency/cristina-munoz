-- Add calendar_id column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN calendar_id text;