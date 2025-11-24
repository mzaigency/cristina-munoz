-- Eliminar todos los triggers de auditoría que puedan estar afectando las tablas
DROP TRIGGER IF EXISTS audit_bookings_trigger ON public.bookings;
DROP TRIGGER IF EXISTS audit_reviews_trigger ON public.reviews;
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;
DROP TRIGGER IF EXISTS audit_services_trigger ON public.services;
DROP TRIGGER IF EXISTS audit_whatsapp_contacts_trigger ON public.whatsapp_contacts;
DROP TRIGGER IF EXISTS audit_whatsapp_messages_trigger ON public.whatsapp_messages;

-- Eliminar la función de auditoría si existe
DROP FUNCTION IF EXISTS public.audit_log_changes() CASCADE;

-- Eliminar la función de limpieza si existe
DROP FUNCTION IF EXISTS public.cleanup_old_audit_logs() CASCADE;