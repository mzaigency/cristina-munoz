-- Add blocked column to whatsapp_contacts
ALTER TABLE public.whatsapp_contacts
ADD COLUMN blocked boolean NOT NULL DEFAULT false;

-- Create index for better performance on blocked contacts
CREATE INDEX idx_whatsapp_contacts_blocked ON public.whatsapp_contacts(blocked);