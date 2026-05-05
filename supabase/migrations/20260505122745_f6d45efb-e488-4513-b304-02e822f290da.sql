ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS stripe_customer_id text;
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_sub ON public.tenants(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer ON public.tenants(stripe_customer_id);