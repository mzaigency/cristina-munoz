-- Create invoices table to store issued invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  fiscal_name TEXT,
  nif TEXT,
  fiscal_address TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  tip_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  stylist_name TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenant staff can view their invoices"
ON public.invoices FOR SELECT
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'stylist'::app_role))
);

CREATE POLICY "Tenant staff can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'stylist'::app_role))
);

CREATE POLICY "SuperAdmin can manage all invoices"
ON public.invoices FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Create index for faster searches
CREATE INDEX idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_created_at ON public.invoices(created_at DESC);