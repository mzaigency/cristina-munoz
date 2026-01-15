-- =============================================
-- BOOKING NOTIFICATION SYSTEM - COMPLETE SETUP
-- =============================================

-- 1. Add tracking columns to bookings (if not exist)
-- These already exist based on types.ts, so just ensure indexes
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_sent ON public.bookings(reminder_sent) WHERE reminder_sent IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_review_request_sent ON public.bookings(review_request_sent) WHERE review_request_sent IS NULL;

-- =============================================
-- 2. TRIGGER: New booking created (notify salon owner)
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_new_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  user_name TEXT;
  tenant_owner_id UUID;
BEGIN
  -- Get config from app_config table
  SELECT value INTO supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_config WHERE key = 'service_role_key';
  
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get user name from profile
  IF NEW.user_id IS NOT NULL THEN
    SELECT COALESCE(full_name, email, 'Un cliente') INTO user_name
    FROM public.profiles WHERE id = NEW.user_id;
  ELSE
    user_name := COALESCE(NEW.customer_name, 'Un cliente');
  END IF;

  -- Get tenant owner from tenant_admins
  SELECT user_id INTO tenant_owner_id
  FROM public.tenant_admins 
  WHERE tenant_id = NEW.tenant_id AND is_owner = true
  LIMIT 1;

  IF tenant_owner_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', tenant_owner_id,
        'title', '📅 Nueva reserva',
        'body', user_name || ' ha reservado para el ' || to_char(NEW."Fecha", 'DD/MM/YYYY') || ' a las ' || to_char(NEW."Hora", 'HH24:MI'),
        'data', jsonb_build_object('type', 'new_booking', 'booking_id', NEW.id)
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'New booking notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net, extensions;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_booking_insert_push ON public.bookings;
CREATE TRIGGER on_booking_insert_push
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_booking_notification();

-- =============================================
-- 3. TRIGGER: Booking status changed (notify user)
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  tenant_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Only notify if user has account
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get config from app_config table
  SELECT value INTO supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_config WHERE key = 'service_role_key';
  
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get tenant name
  SELECT name INTO tenant_name
  FROM public.tenants WHERE id = NEW.tenant_id;

  -- Set notification content based on new status
  IF NEW.status = 'confirmed' THEN
    notification_title := '✅ ¡Cita confirmada!';
    notification_body := 'Tu cita en ' || COALESCE(tenant_name, 'el salón') || ' el ' || to_char(NEW."Fecha", 'DD/MM/YYYY') || ' a las ' || to_char(NEW."Hora", 'HH24:MI') || ' está confirmada';
  ELSIF NEW.status = 'cancelled' THEN
    notification_title := '❌ Cita cancelada';
    notification_body := 'Tu cita en ' || COALESCE(tenant_name, 'el salón') || ' del ' || to_char(NEW."Fecha", 'DD/MM/YYYY') || ' ha sido cancelada';
  ELSE
    -- Don't notify for other status changes
    RETURN NEW;
  END IF;

  -- Send push to user
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
      'data', jsonb_build_object('type', 'booking_status', 'booking_id', NEW.id, 'status', NEW.status)
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Booking status notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net, extensions;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_booking_status_change_push ON public.bookings;
CREATE TRIGGER on_booking_status_change_push
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_status_change();

-- =============================================
-- 4. TRIGGER: New review (notify salon owner)
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_new_review_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  user_name TEXT;
  tenant_owner_id UUID;
BEGIN
  -- Get config from app_config table
  SELECT value INTO supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_config WHERE key = 'service_role_key';
  
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get user name
  SELECT COALESCE(full_name, 'Un cliente') INTO user_name
  FROM public.profiles WHERE id = NEW.user_id;

  -- Get tenant owner from tenant_admins
  SELECT user_id INTO tenant_owner_id
  FROM public.tenant_admins 
  WHERE tenant_id = NEW.tenant_id AND is_owner = true
  LIMIT 1;

  IF tenant_owner_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', tenant_owner_id,
        'title', '⭐ Nueva reseña',
        'body', user_name || ' te ha dejado ' || NEW.rating || ' estrellas',
        'data', jsonb_build_object('type', 'review', 'review_id', NEW.id)
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Review notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net, extensions;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_review_insert_push ON public.reviews;
CREATE TRIGGER on_review_insert_push
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_review_notification();