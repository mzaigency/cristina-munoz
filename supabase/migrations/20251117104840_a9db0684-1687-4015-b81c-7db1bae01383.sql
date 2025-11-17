-- PROTEGER REVIEWS CONTRA SPAM (FASE 2)

-- =============================================================================
-- 1. AÑADIR user_id A LA TABLA REVIEWS
-- =============================================================================

-- Añadir columna user_id (nullable temporalmente para migración)
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Actualizar reviews existentes para asignarles un user_id del sistema
-- (esto es para no perder las reviews existentes)
UPDATE public.reviews 
SET user_id = (
  SELECT id FROM auth.users LIMIT 1
)
WHERE user_id IS NULL;

-- Ahora hacer la columna NOT NULL
ALTER TABLE public.reviews 
ALTER COLUMN user_id SET NOT NULL;

-- Añadir índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- =============================================================================
-- 2. CREAR FUNCIÓN DE RATE LIMITING PARA REVIEWS
-- =============================================================================

-- Función para verificar si un usuario puede crear una review
CREATE OR REPLACE FUNCTION public.can_create_review()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_review_count integer;
BEGIN
  -- Verificar que el usuario esté autenticado
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Contar reviews creadas en las últimas 24 horas por este usuario
  SELECT COUNT(*)
  INTO recent_review_count
  FROM public.reviews
  WHERE user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Permitir solo 1 review cada 24 horas
  RETURN recent_review_count = 0;
END;
$$;

-- =============================================================================
-- 3. ACTUALIZAR POLÍTICAS RLS PARA REQUERIR AUTENTICACIÓN
-- =============================================================================

-- Eliminar política antigua que permitía reviews anónimas
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;

-- Nueva política: Solo usuarios autenticados pueden crear reviews (con rate limiting)
CREATE POLICY "Authenticated users can create reviews with rate limit"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND can_create_review()
);

-- Política para que usuarios puedan ver sus propias reviews (aprobadas o no)
CREATE POLICY "Users can view their own reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR approved = true
);

-- Política para actualizar: usuarios pueden editar sus reviews en las primeras 24h
DROP POLICY IF EXISTS "Users can update their own reviews within 24h" ON public.reviews;

CREATE POLICY "Users can update their own reviews within 24h"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND created_at > (NOW() - INTERVAL '24 hours')
)
WITH CHECK (
  auth.uid() = user_id
  AND created_at > (NOW() - INTERVAL '24 hours')
);

-- =============================================================================
-- 4. TRIGGER PARA VALIDAR RATE LIMITING A NIVEL DE BASE DE DATOS
-- =============================================================================

-- Crear función trigger para validar rate limiting
CREATE OR REPLACE FUNCTION public.validate_review_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Contar reviews del usuario en las últimas 24 horas
  SELECT COUNT(*)
  INTO recent_count
  FROM public.reviews
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Si ya tiene una review en las últimas 24h, rechazar
  IF recent_count > 0 THEN
    RAISE EXCEPTION 'Solo puedes dejar una reseña cada 24 horas'
      USING HINT = 'Por favor, espera antes de enviar otra reseña';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS validate_review_rate_limit_trigger ON public.reviews;
CREATE TRIGGER validate_review_rate_limit_trigger
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_review_rate_limit();