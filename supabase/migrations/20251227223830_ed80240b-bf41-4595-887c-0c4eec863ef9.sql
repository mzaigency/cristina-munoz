-- =============================================
-- FASE 3E: CORREGIR VISTAS CON SECURITY INVOKER
-- =============================================

-- Eliminar vistas existentes
DROP VIEW IF EXISTS public.bookings_decrypted;
DROP VIEW IF EXISTS public.whatsapp_contacts_decrypted;
DROP VIEW IF EXISTS public.whatsapp_messages_decrypted;
DROP VIEW IF EXISTS public.transactions_decrypted;

-- Recrear vistas con SECURITY INVOKER explícito
CREATE VIEW public.bookings_decrypted 
WITH (security_invoker = true)
AS
SELECT 
  b.id,
  b.tenant_id,
  COALESCE(
    decrypt_sensitive_data(b.customer_name_encrypted, b.tenant_id),
    b.customer_name
  ) as customer_name,
  COALESCE(
    decrypt_sensitive_data(b.telefono_encrypted, b.tenant_id),
    b."Telefono"
  ) as "Telefono",
  b."Fecha",
  b."Hora",
  b.end_time,
  b.stylist,
  b.services,
  b.total_duration,
  b.status,
  b.google_calendar_event_id,
  b.calendar_id,
  b.is_part_of_compound,
  b.compound_part,
  b.related_booking_id,
  b.user_id,
  b.skip_availability_check,
  b.created_at,
  b.updated_at
FROM public.bookings b;

CREATE VIEW public.whatsapp_contacts_decrypted
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.tenant_id,
  COALESCE(
    decrypt_sensitive_data(c.phone_number_encrypted, c.tenant_id),
    c.phone_number
  ) as phone_number,
  COALESCE(
    decrypt_sensitive_data(c.name_encrypted, c.tenant_id),
    c.name
  ) as name,
  c.last_message_at,
  c.unread_count,
  c.ai_agent_enabled,
  c.blocked,
  c.created_at,
  c.updated_at
FROM public.whatsapp_contacts c;

CREATE VIEW public.whatsapp_messages_decrypted
WITH (security_invoker = true)
AS
SELECT 
  m.id,
  m.tenant_id,
  m.contact_id,
  COALESCE(
    decrypt_sensitive_data(m.content_encrypted, m.tenant_id),
    m.content
  ) as content,
  m.message_type,
  m.created_at
FROM public.whatsapp_messages m;

CREATE VIEW public.transactions_decrypted
WITH (security_invoker = true)
AS
SELECT 
  t.id,
  t.tenant_id,
  COALESCE(
    decrypt_sensitive_data(t.customer_name_encrypted, t.tenant_id),
    t.customer_name
  ) as customer_name,
  t.services,
  t.subtotal,
  t.discount,
  t.total,
  t.payment_method,
  t.stylist,
  t.notes,
  t.voided,
  t.voided_at,
  t.voided_by,
  t.created_at,
  t.created_by
FROM public.transactions t;