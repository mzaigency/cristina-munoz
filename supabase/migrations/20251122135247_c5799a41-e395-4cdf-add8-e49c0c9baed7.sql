-- Eliminar función de limpieza de audit logs
DROP FUNCTION IF EXISTS cleanup_old_audit_logs();

-- Eliminar triggers relacionados con audit_logs
DROP TRIGGER IF EXISTS audit_bookings_trigger ON public.bookings;
DROP TRIGGER IF EXISTS audit_reviews_trigger ON public.reviews;
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;

-- Eliminar función de auditoría
DROP FUNCTION IF EXISTS audit_log_changes();

-- Eliminar tabla audit_logs
DROP TABLE IF EXISTS public.audit_logs;