-- 1) Realtime para la lista de espera
ALTER TABLE public.waitlist REPLICA IDENTITY FULL;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Límites: sin duplicados y máximo 3 inscripciones activas por clienta y salón
CREATE OR REPLACE FUNCTION public.validate_waitlist_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dup int;
  v_active int;
BEGIN
  IF COALESCE(NEW.status, 'waiting') NOT IN ('waiting', 'notified', 'proposed') THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL AND NEW.client_phone IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_dup
  FROM public.waitlist w
  WHERE w.tenant_id = NEW.tenant_id
    AND w.id <> NEW.id
    AND w.status IN ('waiting', 'notified', 'proposed')
    AND (
      (NEW.user_id IS NOT NULL AND w.user_id = NEW.user_id)
      OR (NEW.client_phone IS NOT NULL AND w.client_phone = NEW.client_phone)
    )
    AND COALESCE(w.preferred_date, DATE '1900-01-01') = COALESCE(NEW.preferred_date, DATE '1900-01-01');

  IF v_dup > 0 THEN
    RAISE EXCEPTION 'Ya estás en la lista de espera para esa fecha en este salón';
  END IF;

  SELECT count(*) INTO v_active
  FROM public.waitlist w
  WHERE w.tenant_id = NEW.tenant_id
    AND w.id <> NEW.id
    AND w.status IN ('waiting', 'notified', 'proposed')
    AND (
      (NEW.user_id IS NOT NULL AND w.user_id = NEW.user_id)
      OR (NEW.client_phone IS NOT NULL AND w.client_phone = NEW.client_phone)
    );

  IF v_active >= 3 THEN
    RAISE EXCEPTION 'Máximo 3 fechas en lista de espera a la vez en este salón';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_waitlist_limits_trg ON public.waitlist;
CREATE TRIGGER validate_waitlist_limits_trg
BEFORE INSERT OR UPDATE OF status, preferred_date ON public.waitlist
FOR EACH ROW EXECUTE FUNCTION public.validate_waitlist_limits();

-- 3) Caducidad y limpieza automática
CREATE OR REPLACE FUNCTION public.expire_old_waitlist_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- a) Propuestas caducadas: se libera el hueco y la clienta vuelve a la cola
  UPDATE public.waitlist
  SET status = 'waiting',
      proposed_date = NULL,
      proposed_time = NULL,
      proposed_stylist_id = NULL,
      proposed_at = NULL,
      proposed_expires_at = NULL,
      proposal_token = NULL,
      updated_at = now()
  WHERE status = 'proposed'
    AND proposed_expires_at IS NOT NULL
    AND proposed_expires_at < now();

  -- b) La fecha deseada ya pasó
  UPDATE public.waitlist
  SET status = 'expired', updated_at = now()
  WHERE status IN ('waiting', 'notified')
    AND preferred_date IS NOT NULL
    AND preferred_date < CURRENT_DATE;

  -- c) Sin fecha concreta: caduca a los 60 días
  UPDATE public.waitlist
  SET status = 'expired', updated_at = now()
  WHERE status IN ('waiting', 'notified')
    AND preferred_date IS NULL
    AND created_at < now() - INTERVAL '60 days';

  -- d) Limpieza de histórico antiguo
  DELETE FROM public.waitlist
  WHERE status IN ('expired', 'cancelled', 'booked')
    AND updated_at < now() - INTERVAL '180 days';
END;
$$;

-- 4) Programación cada 15 minutos
SELECT cron.unschedule('expire-waitlist-entries')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-waitlist-entries');

SELECT cron.schedule(
  'expire-waitlist-entries',
  '*/15 * * * *',
  $$SELECT public.expire_old_waitlist_entries();$$
);