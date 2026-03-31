
CREATE OR REPLACE FUNCTION public.trigger_booking_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
