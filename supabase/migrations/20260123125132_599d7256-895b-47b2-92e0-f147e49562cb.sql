-- ============================================
-- TABLE: sent_reminders (para tracking de recordatorios)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sent_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '2h')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(booking_id, reminder_type)
);

-- RLS for sent_reminders
ALTER TABLE public.sent_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage sent_reminders"
ON public.sent_reminders FOR ALL
USING (true)
WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sent_reminders_booking ON public.sent_reminders(booking_id);

-- ============================================
-- TRIGGER: New direct message notification
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  target_user_id UUID;
  sender_name TEXT;
  notification_type TEXT;
BEGIN
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  
  IF supabase_url IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_type = 'salon' THEN
    SELECT user_id INTO target_user_id
    FROM public.conversations WHERE id = NEW.conversation_id;
    
    SELECT t.name INTO sender_name
    FROM public.conversations c
    JOIN public.tenants t ON t.id = c.tenant_id
    WHERE c.id = NEW.conversation_id;
    
    notification_type := 'messages';
  ELSE
    SELECT ta.user_id INTO target_user_id
    FROM public.conversations c
    JOIN public.tenant_admins ta ON ta.tenant_id = c.tenant_id AND ta.is_owner = true
    WHERE c.id = NEW.conversation_id
    LIMIT 1;
    
    SELECT COALESCE(full_name, 'Un cliente') INTO sender_name
    FROM public.profiles WHERE id = NEW.sender_id;
    
    notification_type := 'client_messages';
  END IF;

  IF target_user_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', target_user_id,
        'title', '💬 ' || COALESCE(sender_name, 'Nuevo mensaje'),
        'body', substring(NEW.content from 1 for 100),
        'data', jsonb_build_object('type', notification_type, 'conversation_id', NEW.conversation_id::text)
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Message notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_message_notification ON public.direct_messages;
CREATE TRIGGER on_message_notification
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_message_notification();

-- ============================================
-- FUNCTION: Send booking reminders (24h y 2h)
-- ============================================
CREATE OR REPLACE FUNCTION public.send_booking_reminders()
RETURNS void AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  booking RECORD;
  now_time TIMESTAMP WITH TIME ZONE := now();
BEGIN
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  
  IF supabase_url IS NULL THEN
    RETURN;
  END IF;

  -- 24h reminders
  FOR booking IN 
    SELECT 
      b.id,
      b.user_id,
      b."Fecha",
      b."Hora",
      t.name as tenant_name
    FROM public.bookings b
    JOIN public.tenants t ON t.id = b.tenant_id
    WHERE b.status = 'confirmed'
      AND b.user_id IS NOT NULL
      AND (b."Fecha"::date + b."Hora"::time) 
          BETWEEN now_time + interval '23 hours' AND now_time + interval '25 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.sent_reminders sr 
        WHERE sr.booking_id = b.id AND sr.reminder_type = '24h'
      )
  LOOP
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', booking.user_id,
        'title', '📅 Recordatorio: mañana tienes cita',
        'body', 'Tu cita en ' || booking.tenant_name || ' es mañana a las ' || LEFT(booking."Hora"::text, 5),
        'data', jsonb_build_object('type', 'reminder_24h', 'booking_id', booking.id::text)
      )
    );
    
    INSERT INTO public.sent_reminders (booking_id, reminder_type)
    VALUES (booking.id, '24h')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- 2h reminders
  FOR booking IN 
    SELECT 
      b.id,
      b.user_id,
      b."Fecha",
      b."Hora",
      t.name as tenant_name
    FROM public.bookings b
    JOIN public.tenants t ON t.id = b.tenant_id
    WHERE b.status = 'confirmed'
      AND b.user_id IS NOT NULL
      AND (b."Fecha"::date + b."Hora"::time) 
          BETWEEN now_time + interval '1.5 hours' AND now_time + interval '2.5 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.sent_reminders sr 
        WHERE sr.booking_id = b.id AND sr.reminder_type = '2h'
      )
  LOOP
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', booking.user_id,
        'title', '⏰ Tu cita es en 2 horas',
        'body', 'Recuerda tu cita en ' || booking.tenant_name || ' a las ' || LEFT(booking."Hora"::text, 5),
        'data', jsonb_build_object('type', 'reminder_2h', 'booking_id', booking.id::text)
      )
    );
    
    INSERT INTO public.sent_reminders (booking_id, reminder_type)
    VALUES (booking.id, '2h')
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- TRIGGER: New booking created (notify salon)
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_new_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  user_name TEXT;
  tenant_owner_id UUID;
  formatted_date TEXT;
BEGIN
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  
  IF supabase_url IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, email) INTO user_name
  FROM public.profiles WHERE id = NEW.user_id;

  SELECT user_id INTO tenant_owner_id
  FROM public.tenant_admins WHERE tenant_id = NEW.tenant_id AND is_owner = true LIMIT 1;

  formatted_date := to_char(NEW."Fecha"::date, 'DD/MM/YYYY');

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
        'body', COALESCE(user_name, NEW.customer_name) || ' ha reservado para el ' || formatted_date || ' a las ' || LEFT(NEW."Hora"::text, 5),
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_booking_insert ON public.bookings;
CREATE TRIGGER on_booking_insert
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_booking_notification();

-- ============================================
-- UPDATE: trigger_new_review_notification
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_new_review_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  user_name TEXT;
  tenant_owner_id UUID;
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

  IF tenant_owner_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', tenant_owner_id,
        'title', 'Nueva reseña ⭐',
        'body', user_name || ' te ha dejado ' || NEW.rating || ' estrellas',
        'data', jsonb_build_object('type', 'new_review', 'review_id', NEW.id::text)
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Review notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_review_notification ON public.reviews;
CREATE TRIGGER on_new_review_notification
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_review_notification();