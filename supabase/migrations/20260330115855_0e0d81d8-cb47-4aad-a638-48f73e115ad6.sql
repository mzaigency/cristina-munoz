CREATE POLICY "Anyone can read maintenance mode"
ON public.app_config
FOR SELECT
TO anon, authenticated
USING (key = 'maintenance_mode');