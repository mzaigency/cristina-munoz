
-- Function to automatically add/update client when a booking is created
CREATE OR REPLACE FUNCTION public.handle_booking_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  existing_client_id uuid;
BEGIN
  -- Check if client already exists by phone
  SELECT id INTO existing_client_id
  FROM public.clients
  WHERE tenant_id = NEW.tenant_id 
    AND phone = NEW."Telefono"
  LIMIT 1;

  IF existing_client_id IS NULL THEN
    -- Create new client
    INSERT INTO public.clients (
      tenant_id,
      name,
      phone,
      total_visits,
      last_visit_at
    ) VALUES (
      NEW.tenant_id,
      NEW.customer_name,
      NEW."Telefono",
      1,
      NOW()
    );
  ELSE
    -- Update existing client
    UPDATE public.clients
    SET 
      total_visits = COALESCE(total_visits, 0) + 1,
      last_visit_at = NOW(),
      updated_at = NOW()
    WHERE id = existing_client_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new bookings
DROP TRIGGER IF EXISTS on_booking_created_add_client ON public.bookings;
CREATE TRIGGER on_booking_created_add_client
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_client();
