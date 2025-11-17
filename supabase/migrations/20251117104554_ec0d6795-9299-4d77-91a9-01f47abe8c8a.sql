-- FASE 1: CORRECCIONES CRÍTICAS DE SEGURIDAD

-- =============================================================================
-- 1. REFORZAR RLS EN PROFILES
-- =============================================================================

-- Eliminar política actual que podría permitir acceso no autorizado
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recrear con validación explícita y denegación de acceso anónimo
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política explícita para denegar acceso anónimo a datos sensibles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- =============================================================================
-- 2. ASEGURAR PASSWORD_RESET_TOKENS
-- =============================================================================

-- Eliminar políticas inseguras
DROP POLICY IF EXISTS "Anyone can create password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "System can update password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Users can view their own password reset tokens" ON public.password_reset_tokens;

-- Solo permitir inserts desde funciones del sistema (edge functions con service role)
CREATE POLICY "Only service role can create tokens"
ON public.password_reset_tokens
FOR INSERT
TO service_role
WITH CHECK (true);

-- Solo permitir updates desde funciones del sistema
CREATE POLICY "Only service role can update tokens"
ON public.password_reset_tokens
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Mantener política de delete para limpieza automática
-- (ya existe: "System can delete password reset tokens")

-- Crear función para validar rate limiting de password resets
CREATE OR REPLACE FUNCTION public.check_password_reset_rate_limit(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Contar tokens creados en las últimas 24 horas para este email
  SELECT COUNT(*)
  INTO recent_count
  FROM public.password_reset_tokens
  WHERE email = user_email
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Permitir máximo 3 intentos cada 24 horas
  RETURN recent_count < 3;
END;
$$;

-- =============================================================================
-- 3. PROTEGER BOOKINGS
-- =============================================================================

-- Eliminar política actual de insert que podría ser insegura
DROP POLICY IF EXISTS "Authenticated users can create their own bookings" ON public.bookings;

-- Recrear con validación estricta de ownership
CREATE POLICY "Authenticated users can create their own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
);

-- Eliminar y recrear política de update para usuarios
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

-- Solo permitir updates si el booking pertenece al usuario
CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'stylist'::app_role)
)
WITH CHECK (
  -- No permitir cambiar el user_id en updates
  user_id = (SELECT user_id FROM public.bookings WHERE id = bookings.id)
);

-- Crear función para validar ownership de bookings
CREATE OR REPLACE FUNCTION public.validate_booking_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- En INSERT, validar que el user_id no sea NULL
  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'user_id cannot be NULL for bookings';
    END IF;
  END IF;
  
  -- En UPDATE, no permitir cambiar el user_id
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      -- Solo admins pueden cambiar el user_id
      IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Cannot change booking ownership';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para validar ownership
DROP TRIGGER IF EXISTS validate_booking_ownership_trigger ON public.bookings;
CREATE TRIGGER validate_booking_ownership_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_ownership();

-- =============================================================================
-- 4. MEJORAR AUDIT_LOGS (Bonus - prevenir manipulación)
-- =============================================================================

-- Eliminar política que permite inserts directos
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Solo permitir inserts desde triggers (security definer)
-- Los audit logs ahora solo se crearán desde el trigger log_audit_event
CREATE POLICY "Only triggers can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (false); -- Nadie puede insertar directamente

-- Los inserts se harán desde el trigger que ya existe (log_audit_event)
-- que tiene SECURITY DEFINER y bypasea RLS