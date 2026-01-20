-- Remove ALL duplicate booking notification triggers first
DROP TRIGGER IF EXISTS on_booking_insert ON public.bookings;
DROP TRIGGER IF EXISTS on_booking_insert_push ON public.bookings;
DROP TRIGGER IF EXISTS on_new_booking_notification ON public.bookings;

-- Now drop the old function with CASCADE to ensure all dependencies are removed
DROP FUNCTION IF EXISTS public.trigger_new_booking_notification() CASCADE;

-- Keep the status change trigger for notifying users about confirmations/cancellations
-- but improve date formatting

CREATE OR REPLACE FUNCTION public.trigger_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  tenant_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
  formatted_date TEXT;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  
  IF supabase_url IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get tenant name
  SELECT name INTO tenant_name
  FROM public.tenants WHERE id = NEW.tenant_id;

  -- Format date as dd/mm/yyyy
  formatted_date := to_char(NEW."Fecha"::date, 'DD/MM/YYYY');

  -- Set notification content based on new status
  IF NEW.status = 'confirmed' THEN
    notification_title := '✅ ¡Cita confirmada!';
    notification_body := 'Tu cita en ' || COALESCE(tenant_name, 'el salón') || ' el ' || formatted_date || ' a las ' || LEFT(NEW."Hora", 5) || ' está confirmada';
  ELSIF NEW.status = 'cancelled' THEN
    notification_title := '❌ Cita cancelada';
    notification_body := COALESCE(tenant_name, 'El salón') || ' ha cancelado tu cita del ' || formatted_date;
  ELSE
    -- Don't notify for other status changes
    RETURN NEW;
  END IF;

  -- Only send push to user if they have a user_id
  IF NEW.user_id IS NOT NULL THEN
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
        'data', jsonb_build_object('type', 'booking', 'booking_id', NEW.id, 'status', NEW.status)
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Booking status notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger with the improved function
DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;

CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_status_change();