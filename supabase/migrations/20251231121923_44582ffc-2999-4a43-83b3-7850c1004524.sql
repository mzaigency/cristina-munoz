-- Create subscription_plans table for configurable pricing
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  monthly_price numeric NOT NULL DEFAULT 0,
  annual_price numeric,
  features jsonb DEFAULT '[]'::jsonb,
  max_stylists integer DEFAULT 5,
  max_services integer DEFAULT 50,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active plans
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- SuperAdmin can manage all plans
CREATE POLICY "SuperAdmin can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Insert default plans
INSERT INTO public.subscription_plans (name, slug, monthly_price, annual_price, max_stylists, max_services, features, sort_order) VALUES
('Básico', 'basic', 29, 290, 2, 20, '["Reservas online", "Calendario básico", "1 estilista"]', 1),
('Profesional', 'professional', 59, 590, 5, 50, '["Todo de Básico", "Hasta 5 estilistas", "WhatsApp integrado", "Caja registradora"]', 2),
('Premium', 'premium', 99, 990, 10, 100, '["Todo de Profesional", "Hasta 10 estilistas", "Google Calendar", "Analytics avanzados"]', 3),
('Enterprise', 'enterprise', 199, 1990, 999, 999, '["Todo de Premium", "Estilistas ilimitados", "API access", "Soporte prioritario"]', 4);

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_tenant_updated_at();