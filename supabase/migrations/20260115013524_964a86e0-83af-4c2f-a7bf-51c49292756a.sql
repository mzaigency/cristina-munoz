-- Create a secure config table for push notification settings
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS - only service role can access
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- No policies = only service role can read/write (secure by default)

-- Insert the Supabase URL (this is public info)
INSERT INTO public.app_config (key, value) 
VALUES ('supabase_url', 'https://lyeyzdbplrgqsvyxpfek.supabase.co')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Update the trigger function to read from config table
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Get config from app_config table
  SELECT value INTO supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_config WHERE key = 'service_role_key';
  
  -- Skip if not configured
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build notification content
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
    RAISE WARNING 'Push notification trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net, extensions;