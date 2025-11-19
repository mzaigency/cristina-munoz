-- Permitir a admins y stylists eliminar mensajes de WhatsApp
CREATE POLICY "Admins and stylists can delete messages"
ON public.whatsapp_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'stylist'::app_role));

-- Permitir a admins y stylists eliminar contactos de WhatsApp
CREATE POLICY "Admins and stylists can delete contacts"
ON public.whatsapp_contacts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'stylist'::app_role));