-- Add optional price field to services table
ALTER TABLE public.services 
ADD COLUMN price numeric(10,2) DEFAULT NULL;