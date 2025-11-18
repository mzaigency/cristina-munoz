-- Agregar campo para contar mensajes no leídos en contactos
ALTER TABLE public.whatsapp_contacts
ADD COLUMN unread_count integer NOT NULL DEFAULT 0;

-- Habilitar realtime para la tabla de contactos
ALTER TABLE public.whatsapp_contacts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_contacts;

-- Habilitar realtime para la tabla de mensajes
ALTER TABLE public.whatsapp_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;

-- Función para incrementar el contador de no leídos cuando llega un mensaje del usuario
CREATE OR REPLACE FUNCTION public.increment_unread_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo incrementar para mensajes del usuario (no del asistente)
  IF NEW.message_type = 'user' THEN
    UPDATE public.whatsapp_contacts
    SET unread_count = unread_count + 1
    WHERE id = NEW.contact_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para incrementar contador automáticamente
CREATE TRIGGER increment_unread_on_user_message
AFTER INSERT ON public.whatsapp_messages
FOR EACH ROW
EXECUTE FUNCTION public.increment_unread_count();

-- Políticas RLS para el nuevo campo
-- Las políticas existentes ya cubren el acceso