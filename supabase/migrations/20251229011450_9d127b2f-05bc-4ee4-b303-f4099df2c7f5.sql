-- Create table for customer fiscal data to auto-fill invoices
CREATE TABLE public.customer_fiscal_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  fiscal_name TEXT,
  nif TEXT,
  fiscal_address TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, customer_name)
);

-- Enable RLS
ALTER TABLE public.customer_fiscal_data ENABLE ROW LEVEL SECURITY;

-- Policies for tenant staff
CREATE POLICY "Tenant staff can view their customer fiscal data"
  ON public.customer_fiscal_data FOR SELECT
  USING (tenant_id = get_user_tenant_id() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist')));

CREATE POLICY "Tenant staff can insert customer fiscal data"
  ON public.customer_fiscal_data FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist')));

CREATE POLICY "Tenant staff can update customer fiscal data"
  ON public.customer_fiscal_data FOR UPDATE
  USING (tenant_id = get_user_tenant_id() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist')))
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "SuperAdmin can manage all customer fiscal data"
  ON public.customer_fiscal_data FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Add show_logo_on_landing column to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS show_logo_on_landing BOOLEAN DEFAULT true;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_fiscal_data_lookup ON public.customer_fiscal_data(tenant_id, customer_name);