-- =============================================
-- FASE 3D: RECREAR FUNCIONES Y VISTAS DE CIFRADO
-- =============================================

-- Función para cifrar datos
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(
  _plaintext TEXT,
  _tenant_id UUID
)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _encryption_key TEXT;
BEGIN
  IF _plaintext IS NULL OR _tenant_id IS NULL THEN
    RETURN NULL;
  END IF;

  _encryption_key := 'lovable_v1_' || _tenant_id::text;
  RETURN extensions.pgp_sym_encrypt(_plaintext, _encryption_key);
END;
$$;

-- Función para descifrar datos
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(
  _ciphertext BYTEA,
  _tenant_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _encryption_key TEXT;
BEGIN
  IF _ciphertext IS NULL OR _tenant_id IS NULL THEN
    RETURN NULL;
  END IF;

  _encryption_key := 'lovable_v1_' || _tenant_id::text;
  RETURN extensions.pgp_sym_decrypt(_ciphertext, _encryption_key);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Vista para bookings con datos descifrados
CREATE OR REPLACE VIEW public.bookings_decrypted AS
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

-- Vista para whatsapp_contacts con datos descifrados
CREATE OR REPLACE VIEW public.whatsapp_contacts_decrypted AS
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

-- Vista para whatsapp_messages con datos descifrados
CREATE OR REPLACE VIEW public.whatsapp_messages_decrypted AS
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

-- Vista para transactions con datos descifrados
CREATE OR REPLACE VIEW public.transactions_decrypted AS
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