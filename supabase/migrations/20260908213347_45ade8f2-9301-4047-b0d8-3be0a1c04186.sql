DO $$
DECLARE
  src text;
BEGIN
  SELECT prosrc INTO src FROM pg_proc WHERE proname = 'invoke_booking_notifications' LIMIT 1;
  src := replace(src, '/functions/v1/booking-notifications', '/functions/v1/weekly-summary-email');
  src := replace(src, 'Failed to invoke booking-notifications', 'Failed to invoke weekly-summary-email');
  EXECUTE 'CREATE OR REPLACE FUNCTION public.invoke_weekly_summary_email() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$' || src || '$fn$';
END $$;

REVOKE ALL ON FUNCTION public.invoke_weekly_summary_email() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('weekly-summary-email') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-summary-email');

SELECT cron.schedule('weekly-summary-email', '0 7 * * 1', 'SELECT public.invoke_weekly_summary_email()');