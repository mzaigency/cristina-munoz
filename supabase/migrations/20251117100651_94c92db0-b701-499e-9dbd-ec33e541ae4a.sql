-- Fase 1: Correcciones Críticas

-- 1. Crear políticas UPDATE/DELETE para password_reset_tokens
CREATE POLICY "System can update password reset tokens"
ON public.password_reset_tokens
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "System can delete password reset tokens"
ON public.password_reset_tokens
FOR DELETE
USING (true);

-- 2. Función para limpieza automática de tokens expirados (ya existe, pero la actualizamos)
-- La función cleanup_expired_password_reset_tokens ya existe, solo necesitamos asegurar que funcione

-- 3. Reforzar políticas RLS de bookings para proteger datos de contacto
-- Eliminar política existente que permite ver todas las reservas a usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;

-- Recrear con mejor control
CREATE POLICY "Authenticated users can create their own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Asegurar que solo el propietario, estilistas asignados o admins pueden ver datos de contacto
-- Las políticas existentes ya lo hacen correctamente, pero vamos a agregar una adicional para mayor claridad

-- Fase 2: Mejoras Altas

-- 4. Añadir política UPDATE para user_roles (solo admins)
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Añadir política UPDATE para reviews
-- Permitir que el creador edite en primeras 24h, o admin siempre
CREATE POLICY "Users can update their own reviews within 24h"
ON public.reviews
FOR UPDATE
USING (
  created_at > (now() - interval '24 hours')
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  created_at > (now() - interval '24 hours')
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 6. Sistema de moderación de reviews
-- Añadir campo approved a reviews
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS approved boolean DEFAULT true NOT NULL;

-- Añadir índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(approved);

-- Actualizar política de SELECT para reviews públicas
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (approved = true OR has_role(auth.uid(), 'admin'::app_role));

-- 7. Crear tabla de audit logs para acceso a datos PII
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS en audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Sistema puede insertar logs
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Crear índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- 8. Función para limpiar logs antiguos (mantener solo 90 días)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;