-- Add name_size column to tenants table for independent tenant name sizing
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS name_size text DEFAULT 'xlarge';

-- Update existing records to use xlarge as default
UPDATE tenants SET name_size = 'xlarge' WHERE name_size IS NULL;