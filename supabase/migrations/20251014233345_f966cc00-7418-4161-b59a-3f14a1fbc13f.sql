-- Add end_time column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS end_time time without time zone;

-- Update existing records to calculate end_time based on booking_time and total_duration
UPDATE public.bookings
SET end_time = (booking_time::time + (total_duration || ' minutes')::interval)::time
WHERE end_time IS NULL;