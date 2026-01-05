-- Eliminar clientes falsos creados por bloqueos
DELETE FROM public.clients 
WHERE name ILIKE '%BLOQUEADO%' 
   OR name ILIKE '%VACACIONES%';

-- Actualizar la función para ignorar bloqueos
CREATE OR REPLACE FUNCTION public.handle_booking_client()
RETURNS TRIGGER AS $$
DECLARE
  existing_client_id uuid;
BEGIN
  -- Ignorar bloqueos y vacaciones (no son clientes reales)
  IF NEW.customer_name ILIKE '%BLOQUEADO%' OR NEW.customer_name ILIKE '%VACACIONES%' THEN
    RETURN NEW;
  END IF;
  
  -- Ignorar si no hay teléfono (requerido para identificar cliente)
  IF NEW."Telefono" IS NULL OR NEW."Telefono" = '' THEN
    RETURN NEW;
  END IF;
  
  -- Ignorar si no hay tenant_id
  IF NEW.tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;