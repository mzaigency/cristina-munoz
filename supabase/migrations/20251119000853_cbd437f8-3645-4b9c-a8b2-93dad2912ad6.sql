-- Allow admins and stylists to update whatsapp_contacts (e.g. mark conversations as read)
CREATE POLICY "Admins and stylists can update whatsapp_contacts"
ON public.whatsapp_contacts
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'stylist'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'stylist'::app_role)
);
