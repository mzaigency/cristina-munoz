
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS short_description text;

CREATE TABLE IF NOT EXISTS public.product_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  booking_id uuid,
  customer_name text NOT NULL,
  customer_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  pickup_type text NOT NULL DEFAULT 'pickup',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_orders_tenant ON public.product_orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_orders_user ON public.product_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_booking ON public.product_orders(booking_id);

ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own product orders"
  ON public.product_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create product orders"
  ON public.product_orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() = user_id)
    OR (user_id IS NULL)
  );

CREATE POLICY "Tenant staff can view their orders"
  ON public.product_orders FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (public.has_role(auth.uid(), 'admin'::app_role, NULL::uuid) OR public.has_role(auth.uid(), 'stylist'::app_role, NULL::uuid))
  );

CREATE POLICY "Tenant staff can update their orders"
  ON public.product_orders FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (public.has_role(auth.uid(), 'admin'::app_role, NULL::uuid) OR public.has_role(auth.uid(), 'stylist'::app_role, NULL::uuid))
  );

CREATE POLICY "Tenant staff can delete their orders"
  ON public.product_orders FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role(auth.uid(), 'admin'::app_role, NULL::uuid)
  );

CREATE POLICY "SuperAdmin can manage all product orders"
  ON public.product_orders FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE TRIGGER product_orders_updated_at
  BEFORE UPDATE ON public.product_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  pid uuid;
  qty integer;
  current_stock integer;
  pname text;
BEGIN
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    pid := (item->>'product_id')::uuid;
    qty := COALESCE((item->>'quantity')::integer, 1);

    SELECT stock, name INTO current_stock, pname
    FROM public.products WHERE id = pid AND tenant_id = NEW.tenant_id;

    IF current_stock IS NULL THEN
      RAISE EXCEPTION 'Producto no encontrado';
    END IF;

    IF current_stock < qty THEN
      RAISE EXCEPTION 'Stock insuficiente para %', COALESCE(pname, 'producto');
    END IF;

    UPDATE public.products
    SET stock = stock - qty, updated_at = now()
    WHERE id = pid AND tenant_id = NEW.tenant_id;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER product_orders_decrement_stock
  AFTER INSERT ON public.product_orders
  FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock();

ALTER TABLE public.product_orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_orders;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Tenant admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.tenant_admins
      WHERE user_id = auth.uid()
        AND tenant_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Tenant admins can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.tenant_admins
      WHERE user_id = auth.uid()
        AND tenant_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Tenant admins can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.tenant_admins
      WHERE user_id = auth.uid()
        AND tenant_id::text = (storage.foldername(name))[1]
    )
  );
