
-- 1. sent_reminders: restringir a service_role
DROP POLICY IF EXISTS "Service role can manage sent_reminders" ON public.sent_reminders;
CREATE POLICY "Only service role manages sent_reminders"
ON public.sent_reminders
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. product_orders: validar tenant activo + límites de campos
DROP POLICY IF EXISTS "Anyone can create product orders" ON public.product_orders;
CREATE POLICY "Public can create valid product orders"
ON public.product_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  is_tenant_active(tenant_id)
  AND length(customer_name) BETWEEN 2 AND 120
  AND (customer_phone IS NULL OR length(customer_phone) <= 30)
  AND (notes IS NULL OR length(notes) <= 500)
  AND total >= 0
  AND jsonb_typeof(items) = 'array'
  AND jsonb_array_length(items) BETWEEN 1 AND 50
  AND (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() = user_id)
    OR (user_id IS NULL)
  )
);

-- 3. b2b_leads: validación de longitudes
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.b2b_leads;
CREATE POLICY "Public can submit valid leads"
ON public.b2b_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(business_name) BETWEEN 2 AND 200
  AND length(contact_name) BETWEEN 2 AND 120
  AND length(email) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(phone) BETWEEN 5 AND 30
  AND (city IS NULL OR length(city) <= 120)
  AND (notes IS NULL OR length(notes) <= 1000)
);

-- 4. error_logs: limitar tamaño de payloads
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;
CREATE POLICY "Public can insert bounded error logs"
ON public.error_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(error_message) <= 2000
  AND (error_stack IS NULL OR length(error_stack) <= 8000)
  AND (component_stack IS NULL OR length(component_stack) <= 8000)
  AND (url IS NULL OR length(url) <= 1000)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
);

-- 5. Revocar EXECUTE en funciones internas de SECURITY DEFINER
-- Mantener accesibles las funciones públicas usadas desde la app
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_tenant_active(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_superadmin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_belongs_to_tenant(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive_data(text, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_sensitive_data(bytea, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, uuid, jsonb, text, timestamp with time zone) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_email_verification_tokens() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_notifications() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_password_reset_tokens() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_error_logs() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_old_waitlist_entries() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_booking_reminders() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.invoke_booking_notifications() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_password_reset_rate_limit(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_superadmin_email(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_create_review() FROM anon;
