
-- Trigger para revertir stock al cancelar
CREATE OR REPLACE FUNCTION public.handle_product_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  pid uuid;
  qty integer;
BEGIN
  -- Si pasa a cancelled desde otro estado: devolver stock
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      pid := (item->>'product_id')::uuid;
      qty := COALESCE((item->>'quantity')::int, 0);
      IF pid IS NOT NULL AND qty > 0 THEN
        UPDATE public.products SET stock = stock + qty WHERE id = pid;
      END IF;
    END LOOP;
  END IF;

  -- Si pasa de cancelled a otro estado (reactivar): volver a restar stock
  IF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM 'cancelled' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      pid := (item->>'product_id')::uuid;
      qty := COALESCE((item->>'quantity')::int, 0);
      IF pid IS NOT NULL AND qty > 0 THEN
        UPDATE public.products SET stock = GREATEST(stock - qty, 0) WHERE id = pid;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_order_status_change ON public.product_orders;
CREATE TRIGGER trg_product_order_status_change
AFTER UPDATE OF status ON public.product_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_product_order_status_change();

-- Tabla para "visto por usuario"
CREATE TABLE IF NOT EXISTS public.admin_seen_state (
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  key text NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tenant_id, key)
);

ALTER TABLE public.admin_seen_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User manages own seen state"
ON public.admin_seen_state
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
