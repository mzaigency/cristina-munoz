-- Add theme_id column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS theme_id text DEFAULT 'immersive';

COMMENT ON COLUMN tenants.theme_id IS 'ID del tema de la landing page: immersive, minimal, split, bold';