-- Add typography and styling fields to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS font_heading text DEFAULT 'Playfair Display',
ADD COLUMN IF NOT EXISTS font_body text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS heading_size text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS button_style text DEFAULT 'rounded';