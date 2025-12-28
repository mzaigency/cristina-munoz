-- Add recurrence columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS recurrence_group_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_pattern jsonb DEFAULT NULL;

-- Create index for faster queries on recurrence groups
CREATE INDEX IF NOT EXISTS idx_bookings_recurrence_group 
ON public.bookings(recurrence_group_id) 
WHERE recurrence_group_id IS NOT NULL;