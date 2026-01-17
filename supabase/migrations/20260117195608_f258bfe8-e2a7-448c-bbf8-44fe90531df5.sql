-- Add reminder_2h_sent column to track 2-hour reminders
-- and create cron job for automatic execution

-- ============================================
-- 1. Add reminder_2h_sent column
-- ============================================
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS reminder_2h_sent TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient querying of pending 2h reminders
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_2h_sent 
ON public.bookings(reminder_2h_sent) 
WHERE reminder_2h_sent IS NULL;

COMMENT ON COLUMN public.bookings.reminder_2h_sent IS 'Timestamp when 2h before reminder notification was sent';

-- ============================================
-- 2. Enable pg_cron extension (if not enabled)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 3. Create function to call booking-notifications Edge Function
-- ============================================
CREATE OR REPLACE FUNCTION public.invoke_booking_notifications()
RETURNS void AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  
  IF supabase_url IS NOT NULL AND service_role_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/booking-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := '{}'::jsonb
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to invoke booking-notifications: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Schedule cron job to run every 15 minutes
-- ============================================
-- Remove existing job if exists
SELECT cron.unschedule('booking-notifications-cron') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'booking-notifications-cron'
);

-- Create new cron job: runs every 15 minutes
SELECT cron.schedule(
  'booking-notifications-cron',
  '*/15 * * * *',
  $$SELECT public.invoke_booking_notifications()$$
);

-- ============================================
-- 5. Add review_request field to preferences if not exists
-- ============================================
ALTER TABLE public.user_notification_preferences
ADD COLUMN IF NOT EXISTS review_request BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.user_notification_preferences.review_request IS 'Whether user wants review request notifications after appointments';