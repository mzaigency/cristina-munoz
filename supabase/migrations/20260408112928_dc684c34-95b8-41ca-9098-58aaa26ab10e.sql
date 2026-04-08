
-- Create b2b_leads table
CREATE TABLE public.b2b_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  services TEXT[],
  status TEXT NOT NULL DEFAULT 'nuevo',
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.b2b_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit a lead"
  ON public.b2b_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only superadmins can read
CREATE POLICY "Superadmins can view all leads"
  ON public.b2b_leads FOR SELECT
  TO authenticated
  USING (public.is_superadmin());

-- Only superadmins can update
CREATE POLICY "Superadmins can update leads"
  ON public.b2b_leads FOR UPDATE
  TO authenticated
  USING (public.is_superadmin());

-- Only superadmins can delete
CREATE POLICY "Superadmins can delete leads"
  ON public.b2b_leads FOR DELETE
  TO authenticated
  USING (public.is_superadmin());

-- Auto-update updated_at
CREATE TRIGGER update_b2b_leads_updated_at
  BEFORE UPDATE ON public.b2b_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
