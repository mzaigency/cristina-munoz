-- Remove duplicate booking notification trigger
-- We'll handle notifications in the Edge Function only for better control

-- Drop the trigger that fires on all booking inserts (duplicate)
DROP TRIGGER IF EXISTS on_booking_insert ON public.bookings;
DROP FUNCTION IF EXISTS public.trigger_new_booking_notification();

-- Drop the in-app notification trigger for bookings (we use push instead)
DROP TRIGGER IF EXISTS trigger_notify_on_new_booking ON public.bookings;

-- Update message notification trigger to show actual message content
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation RECORD;
  _recipient_id UUID;
  _sender_name TEXT;
  _tenant_name TEXT;
  _message_preview TEXT;
BEGIN
  -- Get conversation details
  SELECT * INTO _conversation
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Create message preview (first 80 chars)
  _message_preview := CASE 
    WHEN length(NEW.content) > 80 THEN substring(NEW.content, 1, 80) || '...'
    ELSE NEW.content
  END;
  
  -- Determine recipient based on sender type
  IF NEW.sender_type = 'user' THEN
    -- User sent message, notify admin
    SELECT ta.user_id INTO _recipient_id
    FROM public.tenant_admins ta
    WHERE ta.tenant_id = _conversation.tenant_id AND ta.is_owner = true
    LIMIT 1;
    
    SELECT full_name INTO _sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;
    
    IF _recipient_id IS NOT NULL THEN
      PERFORM public.create_notification(
        _recipient_id,
        'new_message',
        '✉️ ' || COALESCE(_sender_name, 'Cliente'),
        _message_preview,
        _conversation.tenant_id,
        jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id),
        '/admin?tab=messages'
      );
    END IF;
  ELSE
    -- Salon sent message, notify user
    SELECT name INTO _tenant_name
    FROM public.tenants
    WHERE id = _conversation.tenant_id;
    
    PERFORM public.create_notification(
      _conversation.user_id,
      'new_message',
      '✉️ ' || COALESCE(_tenant_name, 'Salón'),
      _message_preview,
      _conversation.tenant_id,
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id),
      '/mensajes?chat=' || NEW.conversation_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

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
    notification_body := 'Tu cita en ' || COALESCE(tenant_name, 'el salón') || ' el ' || formatted_date || ' a las ' || LEFT(NEW."Hora"::text, 5) || ' está confirmada';
  ELSIF NEW.status = 'cancelled' THEN
    notification_title := '❌ Cita cancelada';
    notification_body := COALESCE(tenant_name, 'El salón') || ' ha cancelado tu cita del ' || formatted_date;
  ELSE
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;
CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_status_change();