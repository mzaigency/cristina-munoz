-- Trigger para notificar al admin cuando alguien se une a la lista de espera
CREATE OR REPLACE FUNCTION public.notify_on_new_waitlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _admin_user_id UUID;
BEGIN
  -- Get admin user_id
  SELECT ta.user_id INTO _admin_user_id
  FROM public.tenant_admins ta
  WHERE ta.tenant_id = NEW.tenant_id AND ta.is_owner = true
  LIMIT 1;
  
  IF _admin_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      _admin_user_id,
      'new_waitlist',
      'Nueva solicitud de lista de espera',
      NEW.client_name || ' quiere una cita' || CASE WHEN NEW.preferred_date IS NOT NULL THEN ' para el ' || to_char(NEW.preferred_date, 'DD/MM/YYYY') ELSE '' END,
      NEW.tenant_id,
      jsonb_build_object('waitlist_id', NEW.id, 'client_name', NEW.client_name),
      '/admin?tab=waitlist'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS trg_notify_on_new_waitlist ON public.waitlist;
CREATE TRIGGER trg_notify_on_new_waitlist
AFTER INSERT ON public.waitlist
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_waitlist();