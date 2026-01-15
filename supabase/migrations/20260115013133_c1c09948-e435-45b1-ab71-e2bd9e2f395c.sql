-- Create a database trigger that calls send-push-notification Edge Function
-- whenever a new notification is inserted

-- Enable pg_net extension for async HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Get Supabase URL and key from config (these should be set as database secrets)
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  
  -- Skip if no URL configured
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build notification content based on type
  notification_title := COALESCE(NEW.title, 'Nueva notificación');
  notification_body := COALESCE(NEW.message, '');

  -- Call the Edge Function asynchronously using pg_net
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', notification_title,
      'body', notification_body,
      'data', jsonb_build_object('type', COALESCE(NEW.type, 'notification'), 'notification_id', NEW.id)
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Push notification trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net, extensions;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_notification_insert ON public.notifications;

-- Create the trigger on notifications table
CREATE TRIGGER on_notification_insert
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();