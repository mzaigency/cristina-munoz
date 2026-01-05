-- Drop views that depend on the tables first
DROP VIEW IF EXISTS public.whatsapp_messages_decrypted;
DROP VIEW IF EXISTS public.whatsapp_contacts_decrypted;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.whatsapp_messages;
DROP TABLE IF EXISTS public.whatsapp_contacts;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.customer_fiscal_data;