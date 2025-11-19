-- Añadir campo para controlar si el agente de IA está activo para cada contacto
ALTER TABLE public.whatsapp_contacts
ADD COLUMN ai_agent_enabled BOOLEAN NOT NULL DEFAULT true;

-- Añadir índice para mejorar rendimiento de consultas
CREATE INDEX idx_whatsapp_contacts_ai_agent_enabled ON public.whatsapp_contacts(ai_agent_enabled);

-- Comentario explicativo
COMMENT ON COLUMN public.whatsapp_contacts.ai_agent_enabled IS 'Indica si el agente de IA está activo para este contacto. Si está desactivado, las peluqueras deben responder manualmente.';