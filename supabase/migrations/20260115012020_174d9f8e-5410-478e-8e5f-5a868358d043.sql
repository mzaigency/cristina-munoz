-- Add columns to track notification status for bookings
-- This prevents sending duplicate notifications

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS reminder_sent TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS review_request_sent TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index for faster queries on notification status
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_sent ON public.bookings(reminder_sent) WHERE reminder_sent IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_review_request_sent ON public.bookings(review_request_sent) WHERE review_request_sent IS NULL;

COMMENT ON COLUMN public.bookings.reminder_sent IS 'Timestamp when 24h reminder notification was sent';
COMMENT ON COLUMN public.bookings.review_request_sent IS 'Timestamp when post-appointment review request was sent';