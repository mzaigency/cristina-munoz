-- Create function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create clients table for CRM
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  tags TEXT[] DEFAULT '{}',
  favorite_stylist_id UUID REFERENCES public.tenant_stylists(id) ON DELETE SET NULL,
  notes TEXT,
  total_visits INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  last_visit_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX idx_clients_phone ON public.clients(phone);
CREATE INDEX idx_clients_name ON public.clients(name);

-- RLS Policies
CREATE POLICY "Tenant admins can view their clients"
ON public.clients FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.tenant_admins WHERE tenant_admins.tenant_id = clients.tenant_id AND tenant_admins.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.tenant_stylists WHERE tenant_stylists.tenant_id = clients.tenant_id AND tenant_stylists.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'superadmin')
);

CREATE POLICY "Tenant admins can insert clients"
ON public.clients FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.tenant_admins WHERE tenant_admins.tenant_id = clients.tenant_id AND tenant_admins.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.tenant_stylists WHERE tenant_stylists.tenant_id = clients.tenant_id AND tenant_stylists.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'superadmin')
);

CREATE POLICY "Tenant admins can update their clients"
ON public.clients FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.tenant_admins WHERE tenant_admins.tenant_id = clients.tenant_id AND tenant_admins.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.tenant_stylists WHERE tenant_stylists.tenant_id = clients.tenant_id AND tenant_stylists.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'superadmin')
);

CREATE POLICY "Tenant admins can delete their clients"
ON public.clients FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.tenant_admins WHERE tenant_admins.tenant_id = clients.tenant_id AND tenant_admins.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'superadmin')
);

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();