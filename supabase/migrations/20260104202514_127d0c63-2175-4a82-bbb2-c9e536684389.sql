-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create push_tokens table for device registration
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_tenant ON public.notifications(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_expires ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_push_tokens_user ON public.push_tokens(user_id);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Tenant staff can view tenant notifications"
ON public.notifications FOR SELECT
USING (
  tenant_id IS NOT NULL 
  AND tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'stylist'::app_role))
);

CREATE POLICY "SuperAdmin can manage all notifications"
ON public.notifications FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- RLS Policies for push_tokens
CREATE POLICY "Users can view their own tokens"
ON public.push_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
ON public.push_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
ON public.push_tokens FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
ON public.push_tokens FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "SuperAdmin can manage all tokens"
ON public.push_tokens FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification (for use by triggers and edge functions)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _message TEXT,
  _tenant_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}',
  _action_url TEXT DEFAULT NULL,
  _expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, tenant_id, type, title, message, metadata, action_url, expires_at)
  VALUES (_user_id, _tenant_id, _type, _title, _message, _metadata, _action_url, _expires_at)
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$;

-- Trigger function to notify admin on new booking
CREATE OR REPLACE FUNCTION public.notify_on_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_user_id UUID;
  _tenant_name TEXT;
BEGIN
  -- Get the admin user_id for this tenant
  SELECT ta.user_id INTO _admin_user_id
  FROM public.tenant_admins ta
  WHERE ta.tenant_id = NEW.tenant_id AND ta.is_owner = true
  LIMIT 1;
  
  -- Get tenant name
  SELECT name INTO _tenant_name
  FROM public.tenants
  WHERE id = NEW.tenant_id;
  
  -- Create notification for admin
  IF _admin_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      _admin_user_id,
      'new_booking',
      'Nueva reserva',
      'Nueva cita de ' || NEW.customer_name || ' para el ' || to_char(NEW."Fecha", 'DD/MM/YYYY') || ' a las ' || to_char(NEW."Hora", 'HH24:MI'),
      NEW.tenant_id,
      jsonb_build_object('booking_id', NEW.id, 'customer_name', NEW.customer_name),
      '/admin?tab=calendar'
    );
  END IF;
  
  -- Create notification for user if they have an account
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'booking_confirmed',
      'Reserva confirmada',
      'Tu cita en ' || COALESCE(_tenant_name, 'el salón') || ' para el ' || to_char(NEW."Fecha", 'DD/MM/YYYY') || ' a las ' || to_char(NEW."Hora", 'HH24:MI') || ' ha sido confirmada',
      NEW.tenant_id,
      jsonb_build_object('booking_id', NEW.id),
      '/mis-citas'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new bookings
CREATE TRIGGER trigger_notify_on_new_booking
AFTER INSERT ON public.bookings
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION public.notify_on_new_booking();

-- Trigger function to notify on new message
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation RECORD;
  _recipient_id UUID;
  _sender_name TEXT;
  _tenant_name TEXT;
BEGIN
  -- Get conversation details
  SELECT * INTO _conversation
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Determine recipient based on sender type
  IF NEW.sender_type = 'user' THEN
    -- User sent message, notify admin
    SELECT ta.user_id INTO _recipient_id
    FROM public.tenant_admins ta
    WHERE ta.tenant_id = _conversation.tenant_id AND ta.is_owner = true
    LIMIT 1;
    
    SELECT full_name INTO _sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;
    
    IF _recipient_id IS NOT NULL THEN
      PERFORM public.create_notification(
        _recipient_id,
        'new_message',
        'Nuevo mensaje',
        COALESCE(_sender_name, 'Un cliente') || ' te ha enviado un mensaje',
        _conversation.tenant_id,
        jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id),
        '/admin?tab=messages'
      );
    END IF;
  ELSE
    -- Salon sent message, notify user
    SELECT name INTO _tenant_name
    FROM public.tenants
    WHERE id = _conversation.tenant_id;
    
    PERFORM public.create_notification(
      _conversation.user_id,
      'new_message',
      'Nuevo mensaje',
      COALESCE(_tenant_name, 'El salón') || ' te ha enviado un mensaje',
      _conversation.tenant_id,
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id),
      '/mensajes?chat=' || NEW.conversation_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new messages
CREATE TRIGGER trigger_notify_on_new_message
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_message();

-- Trigger function to notify admin on new review
CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_user_id UUID;
  _reviewer_name TEXT;
BEGIN
  -- Get the admin user_id for this tenant
  SELECT ta.user_id INTO _admin_user_id
  FROM public.tenant_admins ta
  WHERE ta.tenant_id = NEW.tenant_id AND ta.is_owner = true
  LIMIT 1;
  
  -- Get reviewer name
  SELECT full_name INTO _reviewer_name
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  IF _admin_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      _admin_user_id,
      'new_review',
      'Nueva reseña',
      COALESCE(_reviewer_name, 'Un cliente') || ' ha dejado una reseña de ' || NEW.rating || ' estrellas',
      NEW.tenant_id,
      jsonb_build_object('review_id', NEW.id, 'rating', NEW.rating),
      '/admin?tab=reviews'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new reviews
CREATE TRIGGER trigger_notify_on_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_review();