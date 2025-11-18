-- Drop the existing trigger
DROP TRIGGER IF EXISTS validate_booking_ownership_trigger ON public.bookings;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.validate_booking_ownership();

-- Recreate the function with updated logic to allow NULL user_id for admin-created bookings
CREATE OR REPLACE FUNCTION public.validate_booking_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- En INSERT, permitir user_id NULL (para reservas creadas por admin para clientes sin cuenta)
  -- pero si se proporciona un user_id, debe ser válido
  IF TG_OP = 'INSERT' THEN
    -- Si hay user_id, validar que coincida con el usuario autenticado (a menos que sea admin)
    IF NEW.user_id IS NOT NULL AND auth.uid() IS NOT NULL THEN
      IF NEW.user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Cannot create booking for another user';
      END IF;
    END IF;
  END IF;
  
  -- En UPDATE, no permitir cambiar el user_id a menos que sea admin
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Cannot change booking ownership';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER validate_booking_ownership_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_ownership();