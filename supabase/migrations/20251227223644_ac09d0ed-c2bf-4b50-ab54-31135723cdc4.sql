-- =============================================
-- FASE 3C: CREAR COLUMNAS CIFRADAS Y EJECUTAR MIGRACIÓN
-- =============================================

-- Añadir columnas cifradas a bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS customer_name_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS telefono_encrypted BYTEA;

-- Añadir columnas cifradas a whatsapp_contacts
ALTER TABLE public.whatsapp_contacts 
ADD COLUMN IF NOT EXISTS phone_number_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS name_encrypted BYTEA;

-- Añadir columnas cifradas a whatsapp_messages
ALTER TABLE public.whatsapp_messages 
ADD COLUMN IF NOT EXISTS content_encrypted BYTEA;

-- Añadir columnas cifradas a transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS customer_name_encrypted BYTEA;