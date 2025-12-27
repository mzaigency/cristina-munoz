-- =============================================
-- FASE 1A: AÑADIR SUPERADMIN AL ENUM
-- =============================================

-- 1. Añadir 'superadmin' al enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';