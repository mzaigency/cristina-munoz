-- 1. Añadir nuevas columnas para el hueco propuesto
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS proposed_date date,
  ADD COLUMN IF NOT EXISTS proposed_time time,
  ADD COLUMN IF NOT EXISTS proposed_stylist_id uuid,
  ADD COLUMN IF NOT EXISTS proposed_at timestamptz,
  ADD COLUMN IF NOT EXISTS proposed_expires_at timestamptz;

-- 2. RLS: permitir a usuarios ver sus propias entradas
DROP POLICY IF EXISTS "Users view own waitlist" ON public.waitlist;
CREATE POLICY "Users view own waitlist"
  ON public.waitlist
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. RLS: permitir a usuarios actualizar su propia entrada (cancelar, aceptar/rechazar propuesta)
DROP POLICY IF EXISTS "Users update own waitlist" ON public.waitlist;
CREATE POLICY "Users update own waitlist"
  ON public.waitlist
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('cancelled', 'waiting', 'booked')
  );

-- 4. Función para auto-expirar entradas con fecha preferida pasada
CREATE OR REPLACE FUNCTION public.expire_old_waitlist_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.waitlist
  SET status = 'expired', updated_at = now()
  WHERE status IN ('waiting', 'notified', 'proposed')
    AND preferred_date IS NOT NULL
    AND preferred_date < (CURRENT_DATE - INTERVAL '1 day');
END;
$$;