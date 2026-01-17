-- Update function to use hardcoded Supabase URL and anon key
CREATE OR REPLACE FUNCTION public.invoke_booking_notifications()
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://lyeyzdbplrgqsvyxpfek.supabase.co/functions/v1/booking-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXl6ZGJwbHJncXN2eXhwZmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTIwODIsImV4cCI6MjA3NjAyODA4Mn0.ccqvwJRrnHrWQ4qGwFPF9atiR6TH_Q49frNq70P4Wyg'
    ),
    body := '{}'::jsonb
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to invoke booking-notifications: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;