-- Remove price column from services table
ALTER TABLE public.services DROP COLUMN IF EXISTS price;

-- Remove stylist-related columns from cash_register table
ALTER TABLE public.cash_register DROP COLUMN IF EXISTS cris_total;
ALTER TABLE public.cash_register DROP COLUMN IF EXISTS desi_total;