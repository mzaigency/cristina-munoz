
-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_sent ON public.bookings(reminder_sent);
CREATE INDEX IF NOT EXISTS idx_bookings_review_request_sent ON public.bookings(review_request_sent);

-- Trigger: Nueva reserva → Notificar al dueño del salón
CREATE OR REPLACE FUNCTION public.trigger_new_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  user_name TEXT;
  tenant_owner_id UUID;
BEGIN
  SELECT value INTO supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_config WHERE key = 'service_role_key';
  
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, email) INTO user_name
  FROM public.profiles WHERE id = NEW.user_id;

  SELECT user_id INTO tenant_owner_id
  FROM public.tenant_admins WHERE tenant_id = NEW.tenant_id AND is_owner = true LIMIT 1;

  IF tenant_owner_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', tenant_owner_id::text,
        'title', '📅 Nueva reserva',
        'body', COALESCE(user_name, 'Un cliente') || ' ha reservado para el ' || NEW."Fecha",
        'data', jsonb_build_object('type', 'new_booking', 'booking_id', NEW.id::text)
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

DROP TRIGGER IF EXISTS on_new_booking_notification ON public.bookings;
CREATE TRIGGER on_new_booking_notification
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_booking_notification();

-- Trigger: Cambio de estado de reserva → Notificar al usuario
CREATE OR REPLACE FUNCTION public.trigger_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  tenant_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  IF OLD.status = NEW.status OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT value INTO supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_config WHERE key = 'service_role_key';
  
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name INTO tenant_name FROM public.tenants WHERE id = NEW.tenant_id;

  IF NEW.status = 'confirmed' THEN
    notification_title := '✅ Cita confirmada';
    notification_body := 'Tu cita en ' || COALESCE(tenant_name, 'el salón') || ' para el ' || NEW."Fecha" || ' ha sido confirmada';
  ELSIF NEW.status = 'cancelled' THEN
    notification_title := '❌ Cita cancelada';
    notification_body := 'Tu cita en ' || COALESCE(tenant_name, 'el salón') || ' para el ' || NEW."Fecha" || ' ha sido cancelada';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id::text,
      'title', notification_title,
      'body', notification_body,
      'data', jsonb_build_object('type', 'booking_update', 'booking_id', NEW.id::text, 'status', NEW.status)
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Booking status notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net, extensions;

DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;
CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trigger_booking_status_change();

-- Trigger: Nueva reseña → Notificar al dueño del salón
CREATE OR REPLACE FUNCTION public.trigger_new_review_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  reviewer_name TEXT;
  tenant_owner_id UUID;
BEGIN
  SELECT value INTO supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_config WHERE key = 'service_role_key';
  
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, email) INTO reviewer_name
  FROM public.profiles WHERE id = NEW.user_id;

  SELECT user_id INTO tenant_owner_id
  FROM public.tenant_admins WHERE tenant_id = NEW.tenant_id AND is_owner = true LIMIT 1;

  IF tenant_owner_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', tenant_owner_id::text,
        'title', '⭐ Nueva reseña',
        'body', COALESCE(reviewer_name, 'Un cliente') || ' te ha dejado una reseña de ' || NEW.rating || ' estrellas',
        'data', jsonb_build_object('type', 'new_review', 'review_id', NEW.id::text, 'rating', NEW.rating)
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'New review notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net, extensions;

DROP TRIGGER IF EXISTS on_new_review_notification ON public.reviews;
CREATE TRIGGER on_new_review_notification
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_review_notification();

-- Trigger: Nueva notificación en DB → Push automático
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  SELECT value INTO supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_config WHERE key = 'service_role_key';
  
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id::text,
      'title', COALESCE(NEW.title, 'Nueva notificación'),
      'body', COALESCE(NEW.message, ''),
      'data', jsonb_build_object('type', COALESCE(NEW.type, 'notification'), 'notification_id', NEW.id::text)
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Push notification trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net, extensions;

DROP TRIGGER IF EXISTS on_notification_insert ON public.notifications;
CREATE TRIGGER on_notification_insert
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();
