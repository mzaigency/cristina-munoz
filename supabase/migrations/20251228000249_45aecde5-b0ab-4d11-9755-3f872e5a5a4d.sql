-- Add description field to tenants for the Hub cards
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS tagline text;