-- Tabla de conversaciones entre clientes y salones
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unread_count_user INTEGER NOT NULL DEFAULT 0,
  unread_count_salon INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Tabla de mensajes
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'salon')),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'booking_confirmation', 'booking_reminder', 'booking_cancelled')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX idx_conversations_tenant ON public.conversations(tenant_id);
CREATE INDEX idx_conversations_user ON public.conversations(user_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX idx_messages_created ON public.direct_messages(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Tenant staff can view their tenant conversations"
ON public.conversations FOR SELECT
USING (tenant_id = get_user_tenant_id() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist')));

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tenant staff can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist')));

CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Tenant staff can update their tenant conversations"
ON public.conversations FOR UPDATE
USING (tenant_id = get_user_tenant_id() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist')));

CREATE POLICY "SuperAdmin full access conversations"
ON public.conversations FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Políticas para direct_messages
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.conversations c 
  WHERE c.id = conversation_id AND c.user_id = auth.uid()
));

CREATE POLICY "Tenant staff can view messages in their conversations"
ON public.direct_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.conversations c 
  WHERE c.id = conversation_id 
  AND c.tenant_id = get_user_tenant_id()
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
));

CREATE POLICY "Users can send messages"
ON public.direct_messages FOR INSERT
WITH CHECK (
  sender_type = 'user' 
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Tenant staff can send messages"
ON public.direct_messages FOR INSERT
WITH CHECK (
  sender_type = 'salon'
  AND EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND c.tenant_id = get_user_tenant_id()
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
  )
);

CREATE POLICY "Users can update read status"
ON public.direct_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.conversations c 
  WHERE c.id = conversation_id AND c.user_id = auth.uid()
));

CREATE POLICY "Tenant staff can update read status"
ON public.direct_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.conversations c 
  WHERE c.id = conversation_id 
  AND c.tenant_id = get_user_tenant_id()
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
));

CREATE POLICY "SuperAdmin full access messages"
ON public.direct_messages FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Trigger para actualizar last_message_at en conversations
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = now(),
    unread_count_user = CASE WHEN NEW.sender_type = 'salon' THEN unread_count_user + 1 ELSE unread_count_user END,
    unread_count_salon = CASE WHEN NEW.sender_type = 'user' THEN unread_count_salon + 1 ELSE unread_count_salon END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_message_insert
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_on_message();