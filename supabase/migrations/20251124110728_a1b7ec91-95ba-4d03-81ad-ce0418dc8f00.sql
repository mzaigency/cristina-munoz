-- Eliminar la función log_audit_event que está causando el problema
DROP FUNCTION IF EXISTS public.log_audit_event() CASCADE;