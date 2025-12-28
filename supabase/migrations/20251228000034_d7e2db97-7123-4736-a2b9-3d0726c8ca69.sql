-- Allow anyone to view active tenants (for the Salon Hub)
CREATE POLICY "Anyone can view active tenants" ON public.tenants
  FOR SELECT USING (is_active = true);