-- Tabla para almacenar tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por token
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);

-- Índice para búsquedas por email
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);

-- Índice para limpiar tokens expirados
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Habilitar RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios tokens
CREATE POLICY "Users can view their own password reset tokens"
ON public.password_reset_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Función para limpiar tokens expirados automáticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$;