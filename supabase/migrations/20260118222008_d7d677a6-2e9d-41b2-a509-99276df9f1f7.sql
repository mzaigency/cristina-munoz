-- Add TikTok URL field to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS tiktok_url text;