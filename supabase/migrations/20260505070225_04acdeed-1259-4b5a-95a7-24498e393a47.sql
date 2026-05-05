
-- Trigger: send push to admin on new product_orders
CREATE OR REPLACE FUNCTION public.trigger_new_product_order_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  admin_user_id UUID;
  tenant_slug TEXT;
BEGIN
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  IF supabase_url IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO admin_user_id
  FROM public.tenant_admins WHERE tenant_id = NEW.tenant_id AND is_owner = true LIMIT 1;

  SELECT slug INTO tenant_slug FROM public.tenants WHERE id = NEW.tenant_id;

  IF admin_user_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', admin_user_id,
        'title', '🛍️ Nuevo pedido de tienda',
        'body', NEW.customer_name || ' • ' || to_char(NEW.total, 'FM999999.00') || ' €',
        'data', jsonb_build_object('type', 'new_product_order', 'order_id', NEW.id::text, 'tenant_slug', COALESCE(tenant_slug, ''))
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'New product order notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_order_notify ON public.product_orders;
CREATE TRIGGER trg_product_order_notify
AFTER INSERT ON public.product_orders
FOR EACH ROW
EXECUTE FUNCTION public.trigger_new_product_order_notification();
