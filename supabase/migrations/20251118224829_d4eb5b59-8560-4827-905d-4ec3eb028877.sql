-- Crear tabla de contactos de WhatsApp
CREATE TABLE public.whatsapp_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL UNIQUE,
  name text,
  last_message_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla de mensajes de WhatsApp
CREATE TABLE public.whatsapp_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  message_type text NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Solo admin y stylists pueden ver
CREATE POLICY "Admin and stylists can view contacts"
  ON public.whatsapp_contacts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'stylist'::app_role));

CREATE POLICY "Admin and stylists can view messages"
  ON public.whatsapp_messages
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'stylist'::app_role));

-- Function para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_whatsapp_contact_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON public.whatsapp_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_whatsapp_contact_updated_at();

-- Índices para mejor performance
CREATE INDEX idx_whatsapp_contacts_phone ON public.whatsapp_contacts(phone_number);
CREATE INDEX idx_whatsapp_messages_contact_id ON public.whatsapp_messages(contact_id);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);