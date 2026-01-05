-- Resolve linter warning by removing pg_net extension from public schema.
-- This project does not use database-level HTTP calls; external calls are handled in backend functions.

DROP EXTENSION IF EXISTS pg_net CASCADE;