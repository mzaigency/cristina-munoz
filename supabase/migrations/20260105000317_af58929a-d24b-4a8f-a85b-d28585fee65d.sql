-- Create dedicated extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage to authenticated and anon roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Note: pgcrypto is already in the extensions schema based on the encrypt/decrypt functions
-- The functions already reference extensions.pgp_sym_encrypt and extensions.pgp_sym_decrypt
-- This migration ensures the schema exists and has proper permissions

-- Create extension in the extensions schema if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Ensure all future extensions use the extensions schema by default
COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions to keep public schema clean';