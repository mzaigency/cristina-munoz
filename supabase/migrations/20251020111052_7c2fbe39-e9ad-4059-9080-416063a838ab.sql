-- Política para permitir crear tokens (no requiere autenticación)
CREATE POLICY "Anyone can create password reset tokens"
ON public.password_reset_tokens
FOR INSERT
WITH CHECK (true);

-- Política para permitir leer tokens sin autenticación (necesario para validar)
CREATE POLICY "Anyone can read password reset tokens"
ON public.password_reset_tokens
FOR SELECT
USING (true);