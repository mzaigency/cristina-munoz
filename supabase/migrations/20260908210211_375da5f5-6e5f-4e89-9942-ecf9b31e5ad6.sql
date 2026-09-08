CREATE OR REPLACE FUNCTION public.notify_on_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _admin_user_id UUID;
  _tenant_name TEXT;
  _dupes INT;
BEGIN
  -- Una misma visita puede generar varias filas (servicio compuesto o varios
  -- servicios): solo se avisa por la primera.
  SELECT count(*) INTO _dupes
  FROM public.bookings b
  WHERE b.tenant_id = NEW.tenant_id
    AND b.id <> NEW.id
    AND b."Fecha" = NEW."Fecha"
    AND b.customer_name = NEW.customer_name
    AND b.created_at > now() - interval '5 minutes';

  IF _dupes > 0 THEN
    RETURN NEW;
  END IF;

  SELECT ta.user_id INTO _admin_user_id
  FROM public.tenant_admins ta
  WHERE ta.tenant_id = NEW.tenant_id AND ta.is_owner = true
  LIMIT 1;

  SELECT name INTO _tenant_name FROM public.tenants WHERE id = NEW.tenant_id;

  IF _admin_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      _admin_user_id,
      'new_booking',
      'Nueva reserva',
      'Nueva cita de ' || NEW.customer_name || ' para el ' || to_char(NEW."Fecha", 'DD/MM/YYYY') || ' a las ' || to_char(NEW."Hora", 'HH24:MI'),
      NEW.tenant_id,
      jsonb_build_object('booking_id', NEW.id, 'customer_name', NEW.customer_name),
      '/admin?tab=calendar'
    );
  END IF;

  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'booking_confirmed',
      'Reserva confirmada',
      'Tu cita en ' || COALESCE(_tenant_name, 'el salón') || ' para el ' || to_char(NEW."Fecha", 'DD/MM/YYYY') || ' a las ' || to_char(NEW."Hora", 'HH24:MI') || ' ha sido confirmada',
      NEW.tenant_id,
      jsonb_build_object('booking_id', NEW.id),
      '/mis-citas'
    );
  END IF;

  RETURN NEW;
END;
$function$;

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
  _dupes INT;
BEGIN
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);

  IF supabase_url IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Un solo push por visita aunque se creen varias filas
  SELECT count(*) INTO _dupes
  FROM public.bookings b
  WHERE b.tenant_id = NEW.tenant_id
    AND b.id <> NEW.id
    AND b."Fecha" = NEW."Fecha"
    AND b.customer_name = NEW.customer_name
    AND b.created_at > now() - interval '5 minutes';

  IF _dupes > 0 THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO tenant_owner_id
  FROM public.tenant_admins WHERE tenant_id = NEW.tenant_id AND is_owner = true LIMIT 1;

  SELECT slug INTO tenant_slug FROM public.tenants WHERE id = NEW.tenant_id;

  formatted_date := to_char(NEW."Fecha"::date, 'DD/MM/YYYY');

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