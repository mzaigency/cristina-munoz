-- Tabla de productos para venta
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  category TEXT,
  barcode TEXT,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenant staff can view their products"
ON public.products FOR SELECT
USING (tenant_id = get_user_tenant_id() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist')));

CREATE POLICY "Tenant admins can manage their products"
ON public.products FOR ALL
USING (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'))
WITH CHECK (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'));

CREATE POLICY "SuperAdmin can manage all products"
ON public.products FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Tabla de comisiones de estilistas
CREATE TABLE public.stylist_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  stylist_id UUID REFERENCES public.tenant_stylists(id) ON DELETE CASCADE,
  commission_percentage NUMERIC DEFAULT 0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  effective_from DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, stylist_id, effective_from)
);

-- Enable RLS
ALTER TABLE public.stylist_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenant admins can view commissions"
ON public.stylist_commissions FOR SELECT
USING (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant admins can manage commissions"
ON public.stylist_commissions FOR ALL
USING (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'))
WITH CHECK (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'));

CREATE POLICY "SuperAdmin can manage all commissions"
ON public.stylist_commissions FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Índices para rendimiento
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_products_category ON public.products(tenant_id, category);
CREATE INDEX idx_products_barcode ON public.products(tenant_id, barcode);
CREATE INDEX idx_stylist_commissions_tenant ON public.stylist_commissions(tenant_id);
CREATE INDEX idx_stylist_commissions_stylist ON public.stylist_commissions(stylist_id);

-- Añadir campo products a transactions para registrar productos vendidos
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]';