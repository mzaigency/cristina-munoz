
-- Update trigger_booking_status_change to use exact messages from spec
-- and notify admin on client cancellation
CREATE OR REPLACE FUNCTION public.trigger_booking_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  tenant_name TEXT;
  tenant_slug TEXT;
  notification_title TEXT;
  notification_body TEXT;
  formatted_date TEXT;
  admin_user_id UUID;
  services_text TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  
  IF supabase_url IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name, slug INTO tenant_name, tenant_slug
  FROM public.tenants WHERE id = NEW.tenant_id;

  formatted_date := to_char(NEW."Fecha"::date, 'DD/MM/YYYY');

  -- Notify USER on status change
  IF NEW.status = 'confirmed' AND NEW.user_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', '✅ ¡Reserva confirmada!',
        'body', 'Tu cita en ' || COALESCE(tenant_name, 'el salón') || ' el ' || formatted_date || ' a las ' || LEFT(NEW."Hora"::text, 5) || ' está lista',
        'data', jsonb_build_object('type', 'booking_confirmed', 'booking_id', NEW.id::text, 'tenant_slug', COALESCE(tenant_slug, ''))
      )
    );
  ELSIF NEW.status = 'cancelled' THEN
    -- Notify user if admin cancelled
    IF NEW.user_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'user_id', NEW.user_id,
          'title', '🚫 Cita cancelada',
          'body', COALESCE(tenant_name, 'El salón') || ' ha cancelado tu cita del ' || formatted_date || ' a las ' || LEFT(NEW."Hora"::text, 5),
          'data', jsonb_build_object('type', 'booking_cancelled', 'booking_id', NEW.id::text, 'tenant_slug', COALESCE(tenant_slug, ''))
        )
      );
    END IF;

    -- Notify admin if client cancelled (user_id matches the cancelling user)
    SELECT ta.user_id INTO admin_user_id
    FROM public.tenant_admins ta
    WHERE ta.tenant_id = NEW.tenant_id AND ta.is_owner = true
    LIMIT 1;

    IF admin_user_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'user_id', admin_user_id,
          'title', '🚫 Cita cancelada',
          'body', NEW.customer_name || ' canceló su cita del ' || formatted_date || ' a las ' || LEFT(NEW."Hora"::text, 5),
          'data', jsonb_build_object('type', 'client_cancellation', 'booking_id', NEW.id::text, 'tenant_slug', COALESCE(tenant_slug, ''))
        )
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Booking status notification failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update trigger_new_booking_notification to use exact messages
CREATE OR REPLACE FUNCTION public.trigger_new_booking_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  tenant_owner_id UUID;
  tenant_slug TEXT;
  formatted_date TEXT;
  services_list TEXT;
BEGIN
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  
  IF supabase_url IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only notify for client-created bookings (user_id is set)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO tenant_owner_id
  FROM public.tenant_admins WHERE tenant_id = NEW.tenant_id AND is_owner = true LIMIT 1;

  SELECT slug INTO tenant_slug
  FROM public.tenants WHERE id = NEW.tenant_id;

  formatted_date := to_char(NEW."Fecha"::date, 'DD/MM/YYYY');

  -- Build services text from JSON
  SELECT string_agg(s->>'name', ', ') INTO services_list
  FROM jsonb_array_elements(NEW.services::jsonb) s;

  IF tenant_owner_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', tenant_owner_id,
        'title', '✨ Nueva reserva',
        'body', NEW.customer_name || ' • ' || formatted_date || ' ' || LEFT(NEW."Hora"::text, 5) || ' | ' || COALESCE(services_list, ''),
        'data', jsonb_build_object('type', 'new_booking', 'booking_id', NEW.id::text, 'tenant_slug', COALESCE(tenant_slug, ''))
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'New booking notification failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update trigger_new_review_notification to use exact messages
CREATE OR REPLACE FUNCTION public.trigger_new_review_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  user_name TEXT;
  tenant_owner_id UUID;
  tenant_slug TEXT;
BEGIN
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  
  IF supabase_url IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Un cliente') INTO user_name
  FROM public.profiles WHERE id = NEW.user_id;

  SELECT user_id INTO tenant_owner_id
  FROM public.tenant_admins WHERE tenant_id = NEW.tenant_id AND is_owner = true LIMIT 1;

  SELECT slug INTO tenant_slug
  FROM public.tenants WHERE id = NEW.tenant_id;

  IF tenant_owner_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', tenant_owner_id,
        'title', '🌟 Nueva valoración',
        'body', user_name || ' ha dejado una reseña de ' || NEW.rating || ' estrellas',
        'data', jsonb_build_object('type', 'new_review', 'review_id', NEW.id::text, 'tenant_slug', COALESCE(tenant_slug, ''))
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Review notification failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update trigger_message_notification to use exact messages
CREATE OR REPLACE FUNCTION public.trigger_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  target_user_id UUID;
  sender_name TEXT;
  notification_type TEXT;
  message_preview TEXT;
BEGIN
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  
  IF supabase_url IS NULL THEN
    RETURN NEW;
  END IF;

  message_preview := CASE 
    WHEN length(NEW.content) > 80 THEN substring(NEW.content, 1, 80) || '...'
    ELSE NEW.content
  END;

  IF NEW.sender_type = 'salon' THEN
    -- Salon → User
    SELECT user_id INTO target_user_id
    FROM public.conversations WHERE id = NEW.conversation_id;
    
    SELECT t.name INTO sender_name
    FROM public.conversations c
    JOIN public.tenants t ON t.id = c.tenant_id
    WHERE c.id = NEW.conversation_id;
    
    notification_type := 'message';

    IF target_user_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'user_id', target_user_id,
          'title', '💬 Nuevo mensaje de ' || COALESCE(sender_name, 'tu salón'),
          'body', message_preview,
          'data', jsonb_build_object('type', notification_type, 'conversation_id', NEW.conversation_id::text)
        )
      );
    END IF;
  ELSE
    -- User → Admin
    SELECT ta.user_id INTO target_user_id
    FROM public.conversations c
    JOIN public.tenant_admins ta ON ta.tenant_id = c.tenant_id AND ta.is_owner = true
    WHERE c.id = NEW.conversation_id
    LIMIT 1;
    
    SELECT COALESCE(full_name, 'Un cliente') INTO sender_name
    FROM public.profiles WHERE id = NEW.sender_id;
    
    notification_type := 'client_message';

    IF target_user_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'user_id', target_user_id,
          'title', '💬 Nuevo mensaje de ' || sender_name,
          'body', message_preview,
          'data', jsonb_build_object('type', notification_type, 'conversation_id', NEW.conversation_id::text)
        )
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Message notification failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Recreate triggers (drop first to avoid duplicates, then create)
DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;
CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_status_change();

DROP TRIGGER IF EXISTS on_new_booking_notification ON public.bookings;
CREATE TRIGGER on_new_booking_notification
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_booking_notification();

DROP TRIGGER IF EXISTS on_new_review_notification ON public.reviews;
CREATE TRIGGER on_new_review_notification
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_review_notification();

DROP TRIGGER IF EXISTS on_message_notification ON public.direct_messages;
CREATE TRIGGER on_message_notification
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_message_notification();
